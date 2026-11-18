# Rental Manager MVP

Szeretnék egy kis MVP projektet fejleszteni, a neve Rental Manager.
A projekthez az 5 csatolt dokumentációt biztosítom (MVP Project Specification, User Stories és MVP Requirements, Data Model / Database Design, UI / Screen Plan, Test Plan). Ezek a projekt elsődleges specifikációi.
Technológiai keretek:
- Frontend: modern webes technológia (React, TypeScript, Tailwind, shadcn/ui).
- Backend és adatbázis: Lovable Cloud (PostgreSQL).
- Valódi adatbázis perzisztencia (ne használj localStorage-t üzleti adatokhoz).
- Nincs authentication, nincs multi-user működés.
- RLS bekapcsolva minden táblán, anon hozzáféréssel a legkisebb jogosultság elve alapján.
- Reszponzív működés kötelező (desktop, tablet, mobil, nincs vízszintes görgetés).
- Magyar felület és élethű magyar tesztadatok.

Engedélyezem az Issue 1 megvalósítását.
Kérlek, kizárólag az Issue 1-ben (Project basics and fixed data) meghatározottakat implementáld.
Fontos:
- a lakás és bérlő adatai fix, előre betöltött adatok legyenek az adatbázisban;
- ezekhez ne készüljön létrehozás, szerkesztés vagy törlés funkció a felületen (read-only);
- ne implementálj semmilyen Issue 2–6 funkciót;
- maradjon egyszerű és átlátható a felület;
- a reszponzivitás legyen az Issue 1 része;
- a Test Plan TC-01–TC-04 teszteseteit ellenőrizd az implementáció után.
Mivel ez tanulási projekt, az implementáció végén röviden írd le:
- mit változtattál,
- milyen adatbázis-sémát hoztál létre,
- hogyan működik az RLS az Issue 1-ben,
- milyen teszteket futtattál és azok eredményét,
- van-e bármilyen ismert korlátozás vagy nyitott kérdés.
Más funkciót ne készíts.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3a8ecae4-57d2-4eef-b8c6-94052cf833f4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
