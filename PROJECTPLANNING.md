# Projectplanning update — 15 september 2026

## Gebruik

- **Project afgerond** onder Acties markeert een werkelijke opdracht. **Heropen project** maakt dit ongedaan. Omzet en marge blijven in de totalen. Filter op Lopend/Afgerond/Alles.
- Kies boven de grafiek **Maand** of **Kwartaal**. De samenvatting volgt dezelfde keuze; forecast is gewogen met het kanspercentage.
- Het formulier heeft een zelfstandig **Jaar**-veld (2024–2100). Kies bijvoorbeeld januari 2027. Na bewaren verschijnt het betreffende jaar.
- Gebruik **Verdelen** onder Acties of **Verdeel omzet en marge over maanden** in het formulier. Kies start/eindmaand, klik **Gelijk verdelen**, pas eventueel maandbedragen aan en sla op. Ook december–januari is toegestaan. Sommen moeten exact aansluiten bij hoeveelheid × tarief en de totale marge. Gebruik **Terug naar één maand** om spreiding te verwijderen.
- Eén opdracht blijft één databaserecord. Maandverdeling bevat ongewogen omzet en marge; kans wordt eenmaal toegepast bij forecast. Jaaroverzichten en CSV tonen uitsluitend de omzet/marge van het gekozen jaar. Hoeveelheid/tarief blijven die van de hele opdracht.

## Livegang

1. In het bestaande Supabase-project `xmzwebhiljgsxrtfbfvz`, voer `supabase-projectplanning.sql` uit als beheerder. Deze transactie voegt alleen drie velden toe; bestaande gegevens en RLS blijven behouden.
2. Verifieer dat werkelijk de velden `afgerond` (boolean) en `verdeling` (jsonb) heeft en forecast `verdeling` (jsonb).
3. Publiceer `index.html` en `planning.js` gezamenlijk via de bestaande GitHub Pages-branch. Publiceer niet vóór de databasewijziging.
4. Controleer ingelogd de normale gegevens, kwartaalweergave en een geautoriseerde opslag. Voer geen fictieve testomzet in productie in.

Huidige status: lokaal geïmplementeerd en geautomatiseerd getest; Supabase-beheer vraagt om inloggen. Productie niet gewijzigd. De tests gebruiken een geïsoleerde databasevervanger, niet de echte accounts of omzetgegevens.

## Verificatie

`node tests/planning.test.cjs`

`node tests/browser.test.cjs` (Puppeteer vereist; stel zo nodig CHROME_PATH in).

Terugrol frontend: vorige index.html herstellen. De extra databasevelden kunnen blijven staan. Let op: de oude app kent maandverdelingen niet; gebruik deze niet om verdeelde opdrachten te bewerken.
