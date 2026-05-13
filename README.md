# mock-pages

Статический мок формы заявки ACLU (снимок HTML + `aclu-hydrate-selects.js`). Репозиторий: [yurysakovich-fr/mock-pages](https://github.com/yurysakovich-fr/mock-pages).

## Локально

```bash
npm install   # при необходимости
npm run dev
```

Откройте [индекс моков](http://localhost:8765/) или сразу [страницу вакансии](http://localhost:8765/8520829002/job-boards.greenhouse.io/aclu/jobs/8520829002.html).

## GitHub Pages

1. Репозиторий уже на GitHub, ветка `main` с этим кодом.
2. **Обязательно до деплоя:** откройте [Settings → Pages](https://github.com/yurysakovich-fr/mock-pages/settings/pages) репозитория **mock-pages**.
3. В блоке **Build and deployment** поле **Source** переключите на **GitHub Actions** (не «Deploy from a branch»). Сохраните, если GitHub покажет подтверждение.
4. Если при первом запуске Actions появится запрос на окружение **github-pages** — подтвердите во вкладке **Actions** (иногда «Waiting for approval»).
5. После включения Pages заново запустите деплой: вкладка **Actions** → workflow **Deploy GitHub Pages** → **Run workflow** (у workflow включён ручной запуск), либо пустой коммит / повторный push в `main`.

### Ошибка `Creating Pages deployment failed` / `HttpError: Not Found` (404)

Так отвечает API GitHub, если **Pages ещё не включён** или источник не **GitHub Actions**. Выполните шаги 2–3 выше, затем снова запустите workflow. Пока в настройках стоит «None» или ветка вместо Actions, шаг `deploy-pages` будет падать с 404.

У репозитория в организации дополнительно проверьте политики организации: не отключены ли **GitHub Pages** для репозиториев.

После успешного деплоя сайт будет по адресу:

   `https://yurysakovich-fr.github.io/mock-pages/`

   Стартовая страница: `https://yurysakovich-fr.github.io/mock-pages/` → `greenhouse/index.html`. Вакансия:  
   `https://yurysakovich-fr.github.io/mock-pages/8520829002/job-boards.greenhouse.io/aclu/jobs/8520829002.html`

## Скрипты

- `npm run fetch:aclu-fields` — обновить `aclu-form-fields.json` с Greenhouse.
- `npm run fetch:aclu-cdn-assets` — при необходимости подтянуть CDN-ассеты.
