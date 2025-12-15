# Quiz AI (Nivel Intermediar–Avansat) – pentru oameni care chiar folosesc AI, nu doar “îl întreabă”

> Format gândit să intre ușor într-o aplicație: întrebare + 4 opțiuni + răspuns corect + explicație scurtă.

1. **Care afirmație descrie cel mai corect diferența dintre “model” și “sistem” într-o soluție AI de tip Chat/RAG?**
   - a) Modelul = UI-ul, sistemul = promptul.
   - b) Modelul = rețeaua neuronală; sistemul = model + date + orchestrare (retrieval, tool use, guardrails, logging).
   - c) Modelul și sistemul sunt sinonime; doar marketingul le separă.
   - d) Sistemul = GPU, modelul = CPU.
   **Răspuns corect:** b)  
   **Explicație:** În practică, "calitatea" vine din întregul sistem (retrieval, politici, instrumente), nu doar din greutățile modelului.

2. **Într-un pipeline RAG, care e rolul “reranker”-ului?**
   - a) Înlocuiește embeddings cu TF-IDF.
   - b) Reordonează candidatele recuperate, optimizând relevanța față de întrebare (de obicei cu un model mai “scump”, cross-encoder).
   - c) Comprimă contextul ca să încapă în fereastra de context.
   - d) Împiedică halucinațiile prin temperatură 0.
   **Răspuns corect:** b)  
   **Explicație:** Vector search aduce “aproape”; reranker-ul decide “corect” pentru query-ul concret.

3. **Ce problemă rezolvă “chunk overlap” (suprapunerea între fragmente) într-un RAG?**
   - a) Reduce costul embeddings la zero.
   - b) Păstrează continuitatea semantică la granițe, ca să nu tai exact propoziția/ideea relevantă în două.
   - c) Împiedică modelul să ignore system promptul.
   - d) Face vector DB-ul să fie ACID.
   **Răspuns corect:** b)  
   **Explicație:** Fără overlap, bucăți relevante se “pierd” fix unde te doare: la margini.

4. **Care e un semn tipic că ai nevoie de “hybrid search” (vector + lexical) și nu doar vector search?**
   - a) Întrebări care includ coduri, ID-uri, denumiri exacte (“ICD-10 E11.9”, cod intern, nume de medicament).
   - b) Întrebări creative (“scrie o poezie”).
   - c) Orice întrebare în română.
   - d) Când temperatura e > 0.7.
   **Răspuns corect:** a)  
   **Explicație:** Vectorii sunt buni pe sens; lexicalul e excelent pe potrivire exactă (coduri, termeni rari).

5. **În evaluarea unui RAG, ce măsoară cel mai direct “answer groundedness”?**
   - a) Cât de “frumos” scrie modelul.
   - b) În ce măsură răspunsul e susținut de sursele recuperate (citabile), nu inventat.
   - c) Cât de rapid răspunde.
   - d) Câți tokeni consumă.
   **Răspuns corect:** b)  
   **Explicație:** Groundedness = “arăți de unde ai scos”, nu “sună bine”.

6. **Ce e “retrieval leakage” într-un context enterprise/healthcare?**
   - a) Când vector DB-ul consumă prea mult RAM.
   - b) Când utilizatorul sau un prompt injection determină sistemul să recupereze/expună documente pe care nu ar trebui să le vadă (broken access control).
   - c) Când modelul uită începutul conversației.
   - d) Când embeddings sunt prea mari.
   **Răspuns corect:** b)  
   **Explicație:** RAG fără permisiuni robuste = “îți curge” informația pe sub ușă.

7. **Care e abordarea corectă pentru control de acces în RAG?**
   - a) “Îi zicem modelului să nu arate date confidențiale.”
   - b) Filtrare la nivel de retrieval (pre-retrieval/post-filter) pe identitatea user-ului + politici; modelul doar primește ce are voie.
   - c) Temperatură 0 și gata.
   - d) Punem un watermark în răspuns.
   **Răspuns corect:** b)  
   **Explicație:** Securitatea se face înaintea modelului, nu prin rugăminți în prompt.

8. **Ce descrie cel mai corect LoRA (față de full fine-tuning) pentru un LLM?**
   - a) LoRA e același lucru, doar alt nume.
   - b) LoRA adaugă adaptoare mici (low-rank) ca să schimbi comportamentul cu cost mai mic, fără să rescrii complet parametrii de bază.
   - c) LoRA e doar pentru imagini.
   - d) LoRA înseamnă “îi dai modelului mai multe documente” (RAG).
   **Răspuns corect:** b)  
   **Explicație:** LoRA e “tuning eficient”; RAG e “cunoștință externă la cerere”.

9. **Când e mai potrivit RAG decât fine-tuning pentru cunoștințe organizaționale?**
   - a) Când informația se schimbă des (politici, proceduri, ghiduri clinice interne) și vrei trasabilitate/citare.
   - b) Când vrei să schimbi stilul de scriere în mod consistent.
   - c) Când ai un dataset mic de conversații.
   - d) Când vrei latență mare.
   **Răspuns corect:** a)  
   **Explicație:** RAG se actualizează rapid și permite “source of truth”; fine-tuning e mai greu de guvernat pentru factualitate curentă.

10. **Ce e “prompt injection” într-un scenariu cu tool use (email, Jira, DB)?**
   - a) Când utilizatorul scrie cu CAPS.
   - b) Când instrucțiuni malițioase din input (sau din documente recuperate) încearcă să schimbe scopul: să fure secrete, să execute acțiuni neautorizate, să ignore politici.
   - c) Când modelul răspunde prea lung.
   - d) Când modelul nu știe răspunsul.
   **Răspuns corect:** b)  
   **Explicație:** Input-ul e un canal de atac; documentele din RAG pot conține “instrucțiuni capcană”.

11. **Care e o măsură robustă contra prompt injection, dincolo de “nu asculta utilizatorul”?**
   - a) Separarea clară a canalelor (system/developer/user), plus allowlist de unelte + validare strictă a parametrilor (schema, policy checks) înainte de execuție.
   - b) Creștem temperatura.
   - c) Punem modelul să promită că e cuminte.
   - d) Scoatem toate log-urile.
   **Răspuns corect:** a)  
   **Explicație:** Tooling-ul trebuie “îngrădit” tehnic: ce unelte, ce parametri, ce permisiuni, ce audit.

12. **Ce înseamnă “instruction hierarchy” (prioritizarea instrucțiunilor) într-un chat modern?**
   - a) Ultimul mesaj câștigă mereu.
   - b) System > developer > user > tool output; conflictele se rezolvă după această ordine.
   - c) User-ul e întotdeauna șeful.
   - d) Modelul decide după stare de spirit.
   **Răspuns corect:** b)  
   **Explicație:** Dacă nu înțelegi ierarhia, nu înțelegi de ce un prompt “nu merge”.

13. **De ce “temperature = 0” nu garantează factualitate?**
   - a) Pentru că temperatura controlează aleatorietatea, nu adevărul; modelul poate “inventa” determinist.
   - b) Pentru că temperatura 0 e interzisă.
   - c) Pentru că temperatura afectează embeddings.
   - d) Pentru că la 0 modelul nu mai răspunde.
   **Răspuns corect:** a)  
   **Explicație:** Determinism ≠ verificare. Fără surse/verificare, “sigur pe el” poate fi și sigur greșit.

14. **Ce rol are “eval set” (set de evaluare) într-un proiect AI/ML, dincolo de demo?**
   - a) E doar pentru prezentări.
   - b) Devine contractul de calitate: măsori regresii, compari modele, detectezi drift, justifici schimbări.
   - c) Îl folosești să antrenezi direct în producție.
   - d) Înlocuiește testele unitare.
   **Răspuns corect:** b)  
   **Explicație:** Fără eval, “merge” e doar o impresie, nu un KPI.

15. **Ce este “data drift” și de ce contează în healthcare?**
   - a) Când datele sunt stocate pe alt server.
   - b) Când distribuția datelor se schimbă în timp (populație, codificări, practici), iar performanța modelului scade fără să-ți dai seama.
   - c) Când ai prea multe tokenuri.
   - d) Când UI-ul se schimbă.
   **Răspuns corect:** b)  
   **Explicație:** În sănătate, schimbările sunt reale (proceduri, ghiduri, raportare) și modele “îmbătrânesc”.

16. **Care e diferența practică între “guardrails” și “governance”?**
   - a) Nu există.
   - b) Guardrails = controale tehnice în runtime (filtre, policies, validări); Governance = procese + responsabilități + audit + risc + conformitate (cine aprobă, ce monitorizezi, cum răspunzi la incidente).
   - c) Governance = doar training, guardrails = doar legal.
   - d) Guardrails = prompt, governance = temperatură.
   **Răspuns corect:** b)  
   **Explicație:** Un sistem sigur e combinație de tehnic + proces, nu doar “setări”.

17. **Ce este MCP (Model Context Protocol) în termeni operaționali, nu “buzzword”?**
   - a) Un model nou de la Google.
   - b) Un protocol/standard prin care un asistent AI poate descoperi și folosi “unelte” și surse de date expuse de servere MCP (cu schemă, capabilități, permisiuni), fără integrări custom pentru fiecare.
   - c) Un format de fișier pentru embeddings.
   - d) Un tip de vector database.
   **Răspuns corect:** b)  
   **Explicație:** MCP standardizează “cum conectezi AI la lume”: tool-uri, resurse, permisiuni, contract.

18. **Într-o integrare cu MCP/tools, care e greșeala clasică ce duce la incidente?**
   - a) Too much logging.
   - b) Un tool prea permisiv (“do-anything”) fără autorizare pe acțiune și fără validare parametri (ex: poate șterge/expune orice).
   - c) Folosirea Markdown.
   - d) Fereastră de context prea mare.
   **Răspuns corect:** b)  
   **Explicație:** Unelte “mega” + model “obedient” = combinație dezastru, mai ales pe date sensibile.

19. **Ce descrie cel mai bine “agentic workflow” față de un simplu Q&A?**
   - a) Agentul răspunde mai lung.
   - b) Agentul planifică pași, alege unelte, execută acțiuni, verifică rezultate și iterează până atinge un obiectiv (cu limite/politici).
   - c) Agentul e doar un chatbot cu emoji.
   - d) Agentul e un model mai mare.
   **Răspuns corect:** b)  
   **Explicație:** Diferența e capacitatea de a acționa și a orchestra, nu “mărimea”.

20. **Ce e o practică sănătoasă pentru “human-in-the-loop” în procese sensibile (ex: comunicații către pacienți, decizii clinice, schimbări în sisteme)?**
   - a) Lăsăm agentul să trimită direct, că e mai rapid.
   - b) Confirmare umană pe acțiuni cu impact, cu preview, explicație/citare, și jurnal de audit; automatizare doar în zone cu risc scăzut.
   - c) Oprirea completă a AI-ului.
   - d) Doar temperatură 0.
   **Răspuns corect:** b)  
   **Explicație:** În realitate, vrei viteză + control: AI propune, omul decide când miza e mare.


