# mock-pages

Статический мок формы заявки ACLU (снимок HTML + `aclu-hydrate-selects.js`). Репозиторий: [yurysakovich-fr/mock-pages](https://github.com/yurysakovich-fr/mock-pages).

## Локально

```bash
npm install   # при необходимости
npm run dev
```

Откройте [индекс моков](http://localhost:8765/) или сразу [страницу вакансии](http://localhost:8765/8520829002/job-boards.greenhouse.io/aclu/jobs/8520829002.html).

## GitHub Pages

1. Создайте репозиторий на GitHub и запушьте этот проект (`main` или `master`).
2. **Settings → Pages → Build and deployment → Source:** выберите **GitHub Actions** (не «Deploy from a branch»).
3. После первого успешного запуска workflow сайт будет по адресу:

   `https://yurysakovich-fr.github.io/mock-pages/`

   Стартовая страница: `https://yurysakovich-fr.github.io/mock-pages/` → `greenhouse/index.html`. Вакансия:  
   `https://yurysakovich-fr.github.io/mock-pages/8520829002/job-boards.greenhouse.io/aclu/jobs/8520829002.html`

## Скрипты

- `npm run fetch:aclu-fields` — обновить `aclu-form-fields.json` с Greenhouse.
- `npm run fetch:aclu-cdn-assets` — при необходимости подтянуть CDN-ассеты.
