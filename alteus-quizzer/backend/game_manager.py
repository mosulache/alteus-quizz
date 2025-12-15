import asyncio
import json
from typing import Dict, List, Optional
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # session_code -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # session_code -> {participant_id: WebSocket}
        self.participant_connections: Dict[str, Dict[str, WebSocket]] = {}
        # session_code -> host_websocket
        self.host_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_code: str, client_id: str, is_host: bool = False):
        await websocket.accept()
        if session_code not in self.active_connections:
            self.active_connections[session_code] = []
            self.participant_connections[session_code] = {}
        
        self.active_connections[session_code].append(websocket)
        
        if is_host:
            self.host_connections[session_code] = websocket
        else:
            self.participant_connections[session_code][client_id] = websocket

    def disconnect(self, websocket: WebSocket, session_code: str, client_id: str, is_host: bool = False):
        if session_code in self.active_connections:
            if websocket in self.active_connections[session_code]:
                self.active_connections[session_code].remove(websocket)
            
            if is_host and session_code in self.host_connections:
                del self.host_connections[session_code]
            elif client_id in self.participant_connections.get(session_code, {}):
                del self.participant_connections[session_code][client_id]

    async def broadcast(self, session_code: str, message: dict):
        if session_code in self.active_connections:
            # Create a list of tasks for sending messages
            tasks = []
            # Copy list to avoid issues if disconnection happens during iteration
            for connection in self.active_connections[session_code][:]: 
                tasks.append(connection.send_json(message))
            
            # Run all send operations concurrently
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

class ActiveGame:
    def __init__(self, quiz_data: dict, session_code: str):
        self.quiz = quiz_data
        self.session_code = session_code
        self.status = "WAITING" # WAITING, ACTIVE, REVIEW, FINISHED
        self.current_question_index = 0
        self.participants: Dict[str, dict] = {} # id -> {name, color, score}
        self.answers: Dict[str, str] = {} # participant_id -> answer_id (for current question)
        self.timer_task = None
        self.time_remaining = 0

    def add_participant(self, p_id: str, name: str, color: str):
        if p_id not in self.participants:
            self.participants[p_id] = {"name": name, "color": color, "score": 0}

    def remove_participant(self, p_id: str):
        if p_id in self.participants:
            del self.participants[p_id]
            if p_id in self.answers:
                del self.answers[p_id]

    def prune_participants(self, active_ids: List[str]):
        # Remove participants who are not in the active_ids list
        # We need to be careful: self.participants keys are client_ids
        # active_ids should be list of connected client_ids for this session
        
        current_ids = list(self.participants.keys())
        for pid in current_ids:
            if pid not in active_ids:
                self.remove_participant(pid)

    def start_game(self):
        self.status = "ACTIVE"
        self.current_question_index = 0
        self.start_question_timer()

    def next_question(self):
        if self.current_question_index < len(self.quiz['questions']) - 1:
            self.current_question_index += 1
            self.status = "ACTIVE"
            self.answers = {} # Reset answers
            self.start_question_timer()
        else:
            self.status = "FINISHED"

    def submit_answer(self, p_id: str, answer_id: str):
        if self.status == "ACTIVE":
            self.answers[p_id] = answer_id

    def skip_timer(self):
        if self.status == "ACTIVE":
            self.time_remaining = 0
            # The timer loop will see 0, break, and trigger REVIEW transition

    def reset_game(self):
        self.status = "WAITING"
        self.current_question_index = 0
        self.answers = {}
        for p in self.participants.values():
            p['score'] = 0
        self.time_remaining = 0

    def start_question_timer(self):
        question = self.quiz['questions'][self.current_question_index]
        self.time_remaining = question['time_limit']
        if self.timer_task:
            self.timer_task.cancel()
        self.timer_task = asyncio.create_task(self._timer_loop())

    async def _timer_loop(self):
        while self.time_remaining > 0 and self.status == "ACTIVE":
            await asyncio.sleep(1)
            self.time_remaining -= 1
            # We could broadcast tick here, or just let clients handle it and sync occasionally
            # For robustness, let's broadcast every sec or so, or just rely on initial sync + client clock.
            # But broadcasting is safer for sync.
            await manager.broadcast(self.session_code, {"type": "TICK", "timeRemaining": self.time_remaining})
        
        if self.status == "ACTIVE":
            self.status = "REVIEW"
            self.calculate_scores()
            await manager.broadcast(self.session_code, {"type": "STATE_UPDATE", "state": self.get_state()})

    def calculate_scores(self):
        question = self.quiz['questions'][self.current_question_index]
        # Find correct option ids
        correct_ids = [opt['id'] for opt in question['options'] if opt.get('is_correct')]
        
        # In our simple model, maybe just one correct answer? 
        # The prompt implies potentially multiple, but usually one. 
        # Let's assume standard multiple choice where one is correct for now, or match any.
        
        for p_id, ans_id in self.answers.items():
            # Check if ans_id matches any correct option (assuming ans_id is the option ID)
            # We need to map options to find which is correct.
            # Actually, `questions` structure needs to be consistent.
            # We will use the ID from the database for options.
             
             # Simple check:
             is_correct = False
             for opt in question['options']:
                 if str(opt['id']) == str(ans_id) and opt.get('is_correct'):
                     is_correct = True
                     break
            
             if is_correct:
                 self.participants[p_id]['score'] += question['points']

    def get_state(self):
        # Prepare safe state for clients
        current_q = None
        if self.current_question_index < len(self.quiz['questions']):
            q = self.quiz['questions'][self.current_question_index]
            current_q = {
                "id": str(q['id']),
                "text": q['text'],
                "timeLimit": q['time_limit'],
                "options": [{"id": str(o['id']), "text": o['text']} for o in q['options']], # Don't send is_correct
                "media": q.get('media_url')
            }
            
            # If in REVIEW or FINISHED, maybe we send correct answers?
            if self.status in ["REVIEW", "FINISHED"]:
                 current_q["options"] = [{"id": str(o['id']), "text": o['text'], "isCorrect": o.get('is_correct')} for o in q['options']]
                 current_q["explanation"] = q.get('explanation')

        return {
            "sessionCode": self.session_code,
            "status": self.status,
            "currentQuestionIndex": self.current_question_index,
            "timeRemaining": self.time_remaining,
            "participants": [{"id": k, **v} for k, v in self.participants.items()],
            "currentQuestion": current_q,
            "totalQuestions": len(self.quiz['questions'])
        }

# Global Managers
manager = ConnectionManager()
games: Dict[str, ActiveGame] = {}

