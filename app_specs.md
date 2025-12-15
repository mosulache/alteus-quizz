# Alteus Quizzer - Specificații Aplicație

## 1. Overview

**Nume aplicație:** Alteus Quizzer  
**Site companie:** Alteus.ai  
**Scop:** Aplicație interactivă de tip Kahoot! pentru quiz-uri la începutul cursurilor de AI  
**Context:** Aplicația poate deveni un feature/componentă în platforma Alteus.ai

## 2. Concept și Flow Principal

### 2.1. Flow Utilizator Participant

1. **Accesare aplicație:**
   - Utilizatorul scanează un QR code pentru a accesa linkul aplicației
   - Accesul se face de pe telefon sau laptop
   - Nu este necesară autentificare pentru participanți

2. **Înregistrare în sesiune:**
   - Utilizatorul primește vizual o culoare unică (asignată automat)
   - Utilizatorul poate introduce un nume (opțional sau obligatoriu - configurabil)
   - Culoarea și numele sunt afișate pe ecranul TV pentru identificare

3. **Participare la quiz:**
   - Pe ecranul TV mare (proiectat de pe server) se afișează întrebarea curentă
   - Pe dispozitivul personal (telefon/laptop) utilizatorul vede opțiunile de răspuns
   - Utilizatorul selectează răspunsul de pe dispozitivul personal
   - Există un timer pentru fiecare întrebare (configurabil)

4. **După expirarea timerului:**
   - Se afișează răspunsul corect
   - Se afișează explicația pentru răspunsul corect
   - Se poate configura afișarea clasamentului (leaderboard) după fiecare întrebare sau la final

### 2.2. Flow Admin/Prezentator

1. **Creare și gestionare quiz-uri:**
   - Admin-ul poate crea quiz-uri noi
   - Poate defini seturi de întrebări
   - Poate edita întrebările și răspunsurile
   - Poate adăuga poze de background pe cardul quiz-ului

2. **Lansare sesiune:**
   - Admin-ul generează un QR code pentru sesiunea de quiz
   - Proiectează ecranul TV (mod prezentator)
   - Controlează progresul quiz-ului (trecere la următoarea întrebare, pauză, etc.)

3. **Mod TEST:**
   - În modul TEST, participanții văd 2 butoane suplimentare: "rework" și "exclude"
   - Aceste butoane permit marcarea unei întrebări pentru revizuire
   - Admin-ul poate vedea întrebările marcate și le poate reformula sau exclude

## 3. Funcționalități Detaliate

### 3.1. Gestionare Quiz-uri

- **Creare quiz:**
  - Titlu quiz
  - Descriere
  - Imagine de background/card (opțional)
  - Setări generale (timer per întrebare, afișare leaderboard, etc.)

- **Gestionare întrebări:**
  - Adăugare/editare/ștergere întrebări
  - Fiecare întrebare poate avea:
    - Text întrebare
    - 2-6 opțiuni de răspuns (configurabil)
    - Răspuns corect (unul sau mai multe - configurabil)
    - Explicație pentru răspunsul corect
    - Timp alocat (sau folosește timpul default al quiz-ului)
    - Puncte acordate pentru răspuns corect (configurabil)
    - Imagine/media asociată (opțional)

- **Organizare:**
  - Quiz-urile pot fi organizate în categorii/colecții
  - Căutare și filtrare quiz-uri
  - Duplicare quiz-uri existente

### 3.2. Sesiuni de Quiz

- **Creare sesiune:**
  - Selectare quiz existent
  - Generare cod unic pentru sesiune
  - Generare QR code pentru accesare
  - Setări sesiune (mod TEST activat/dezactivat, etc.)

- **Conducere sesiune:**
  - Ecran prezentator (TV) cu:
    - Afișare întrebare curentă
    - Timer countdown
    - Statistici în timp real (câți au răspuns, etc.)
    - Clasament după fiecare întrebare (dacă e configurat)
    - Clasament final la terminarea quiz-ului
  - Controale pentru prezentator:
    - Start/Pause/Resume quiz
    - Trecere manuală la următoarea întrebare
    - Resetare sesiune
    - Export rezultate

- **Participare:**
  - Interfață simplă pe dispozitiv mobil
  - Afișare culoare și nume utilizator
  - Afișare întrebare și opțiuni de răspuns
  - Confirmare vizuală după trimiterea răspunsului
  - Afișare feedback după expirarea timerului (corect/greșit, explicație)

### 3.3. Mod TEST

- **Funcționalitate:**
  - Activare/dezactivare pentru fiecare sesiune
  - În mod TEST, participanții văd butoanele "rework" și "exclude"
  - Marcarea unei întrebări cu "rework" sau "exclude" salvează feedback-ul
  - Admin-ul poate vedea statistici despre întrebările marcate
  - Admin-ul poate edita sau exclude întrebările pe baza feedback-ului

### 3.4. Clasament și Statistici

- **Leaderboard:**
  - Configurabil: afișare după fiecare întrebare sau doar la final
  - Afișare top participanți cu:
    - Nume (sau culoare dacă nu au nume)
    - Puncte totale
    - Procentaj răspunsuri corecte
    - Timp mediu de răspuns (opțional)
  
- **Statistici pentru admin:**
  - Rezultate detaliate per sesiune
  - Export CSV/JSON cu rezultate
  - Analiză per întrebare (câți au răspuns corect/greșit)
  - Feedback din modul TEST

## 4. Arhitectură Tehnică

### 4.1. Componente Principale

- **Frontend Participant:** Interfață web responsive pentru participanți (telefon/laptop)
- **Frontend Prezentator:** Interfață web pentru ecranul TV (mod prezentator)
- **Frontend Admin:** Panou de administrare pentru gestionarea quiz-urilor
- **Backend API:** Server pentru gestionarea logicii de business
- **Database:** Stocare quiz-uri, sesiuni, răspunsuri, utilizatori
- **Real-time Communication:** WebSockets sau Server-Sent Events pentru sincronizare în timp real

### 4.2. Tehnologii Recomandate

- **Frontend:** React/Next.js sau Vue.js pentru interfețe responsive
- **Backend:** Node.js/Express sau Python/FastAPI
- **Database:** PostgreSQL sau MongoDB pentru date structurate
- **Real-time:** Socket.io sau WebSockets nativi
- **Deployment:** Docker containers, cloud hosting (AWS, Vercel, etc.)
- **QR Code:** Bibliotecă pentru generare QR codes (qrcode.js sau similar)

### 4.3. Structura Datelor

**Quiz:**
- id, titlu, descriere, imagine_background, setari (timer_default, puncte_default, etc.), data_creare, data_modificare

**Intrebare:**
- id, quiz_id, text_intrebare, tip_raspuns (single/multiple), timp_alocat, puncte, imagine/media, ordine, explicatie

**Raspuns:**
- id, intrebare_id, text_raspuns, este_corect, ordine

**Sesiune:**
- id, quiz_id, cod_unic, qr_code_url, mod_test, status (pregatire/activ/finalizat), data_creare, data_start, data_finalizare

**Participant:**
- id, sesiune_id, nume, culoare, data_inscriere

**RaspunsParticipant:**
- id, sesiune_id, participant_id, intrebare_id, raspuns_id, corect, timp_raspuns, data_raspuns

**FeedbackTEST:**
- id, sesiune_id, participant_id, intrebare_id, tip_feedback (rework/exclude), data_feedback

## 5. Interfață Utilizator

### 5.1. Ecran Participant (Mobil/Desktop)

- **Ecran de conectare:**
  - Scanare QR code sau introducere cod manual
  - Introducere nume (opțional)
  - Afișare culoare asignată
  
- **Ecran așteptare:**
  - Mesaj "Așteptați începerea quiz-ului"
  - Culoare și nume utilizator
  
- **Ecran întrebare:**
  - Text întrebare (sau mesaj să urmărească ecranul TV)
  - Opțiuni de răspuns (butoane mari, ușor de apăsat)
  - Timer countdown
  - Butoane "rework"/"exclude" (doar în mod TEST)
  
- **Ecran feedback:**
  - Indică dacă răspunsul a fost corect/greșit
  - Afișează explicația
  - Afișează clasamentul (dacă e configurat)

### 5.2. Ecran Prezentator (TV)

- **Ecran pregătire:**
  - QR code pentru participanți
  - Lista participanți conectați (cu culori și nume)
  - Buton "Start Quiz"
  
- **Ecran întrebare activă:**
  - Text întrebare mare, clar
  - Timer countdown vizibil
  - Statistici: "X din Y participanți au răspuns"
  - Imagine/media asociată (dacă există)
  
- **Ecran rezultate întrebare:**
  - Răspunsul corect evidențiat
  - Explicație
  - Statistici: câți au răspuns corect/greșit
  - Clasament parțial (dacă e configurat)
  - Buton "Următoarea întrebare"
  
- **Ecran final:**
  - Clasament complet
  - Top 3 participanți evidențiați
  - Buton "Închide sesiunea" sau "Restart"

### 5.3. Panou Admin

- **Dashboard:**
  - Lista quiz-uri existente
  - Creare quiz nou
  - Sesiuni active
  
- **Editor quiz:**
  - Formular pentru detalii quiz
  - Lista întrebări (drag & drop pentru reordonare)
  - Editor pentru fiecare întrebare
  - Preview quiz
  
- **Gestionare sesiuni:**
  - Istoric sesiuni
  - Vizualizare rezultate
  - Export date

## 6. Cerințe Non-Funcționale

### 6.1. Performanță

- Sincronizare în timp real între toți participanții (< 500ms latency)
- Suport pentru minim 100 participanți simultan per sesiune
- Timp de încărcare inițial < 2 secunde

### 6.2. Securitate

- Validare input pentru toate câmpurile
- Protecție împotriva SQL injection, XSS
- Rate limiting pentru API endpoints
- Coduri sesiune unice și neprevăzute

### 6.3. Accesibilitate

- Interfață responsive (mobile-first)
- Suport pentru culori contrastate pentru accesibilitate vizuală
- Text clar și lizibil pe toate dispozitivele

### 6.4. Compatibilitate

- Suport pentru toate browserele moderne (Chrome, Firefox, Safari, Edge)
- Suport pentru iOS și Android
- Funcționalitate offline limitată (caching pentru întrebări)

## 7. Integrare cu Platforma Alteus.ai

- **Considerații viitoare:**
  - API pentru integrare cu platforma principală
  - Autentificare SSO (dacă e necesar)
  - Partajare quiz-uri între utilizatori platformei
  - Dashboard centralizat în platforma principală

## 8. Deployment și Infrastructură

- **Hosting:**
  - Backend API pe server dedicat sau cloud
  - Frontend static pe CDN
  - Database pe serviciu gestionat
  
- **Scalabilitate:**
  - Arhitectură care permite scalare orizontală
  - Load balancing pentru sesiuni multiple simultane
  
- **Monitoring:**
  - Logging pentru toate acțiunile importante
  - Monitoring performanță și erori
  - Analytics pentru utilizare

## 9. Roadmap Implementare

### Faza 1 - MVP (Minimum Viable Product)
- Creare și gestionare quiz-uri (admin)
- Sesiuni de quiz cu sincronizare real-time
- Participare de pe dispozitive mobile
- Ecran prezentator pentru TV
- Clasament de bază

### Faza 2 - Funcționalități Avansate
- Mod TEST cu feedback
- Statistici detaliate și export
- Îmbunătățiri UI/UX
- Optimizări performanță

### Faza 3 - Integrare și Scalare
- Integrare cu platforma Alteus.ai
- Funcționalități suplimentare bazate pe feedback
- Scalare pentru utilizare masivă

## 10. Note Suplimentare

- **Culori participanți:** Se recomandă o paletă de culori distincte și accesibile (evitând culori similare)
- **Timer:** Timer-ul poate fi configurabil per quiz sau per întrebare, cu valori default rezonabile (ex: 30 secunde)
- **Puncte:** Sistem de puncte poate fi simplu (1 punct per răspuns corect) sau complex (puncte bazate pe viteza de răspuns)
- **Media:** Suport pentru imagini, video, audio în întrebări (implementare progresivă)
