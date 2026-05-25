# Pixi.js + Skia

Редактор векторной графики, объединяющий Pixi.js для интерактивного рендеринга и Skia для высококачественного экспорта в PDF.

<h3>
  <a href="https://sbrd.vercel.app">Демо-стенд: sbrd.vercel.app</a>
</h3>

## Возможности

- **Двойной рендеринг**: Pixi.js, Skia
- **Поддержка событий**: События pointerDown и pointerUp для объектов
- **Поддержка фигур**: Прямоугольники, эллипсы, круги, линии
- **Экспорт PDF**: Генерация векторного PDF через Skia canvaskit-wasm-pdf
- **Интерактивность**: Добавление случайных фигур, клик для выделения с визуальной обратной связью

## Технологии

- [Pixi.js] - pixi.js-legacy - 7.2.4
- [Skia] - скомпилированная версия @rollerbird/canvaskit-wasm-pdf
- TypeScript для типобезопасности
- Vite для быстрой разработки

## Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd sb

# Установка зависимостей
npm install

## Настройка Skia WASM:

Файл canvaskit-pdf.wasm должен находиться в public корня проекта
Можно скопировать из node_modules/@rollerbird/canvaskit-wasm-pdf/bin/canvaskit-pdf.wasm

## Запуск

# Режим разработки
npm run dev

# Сборка production версии
npm run build

# Предпросмотр собранной версии
npm run preview

## Структура проекта

src/
├── core/          # Основная логика (рендеринг, выделение, hit-test)
├── export/        # Логика экспорта
├── shapes/        # Создание и регистрация фигур
├── ui/            # UI компоненты (оверлей, статус, обработчики)
├── utils/         # Вспомогательные функции
├── types/         # TypeScript типы
├── scene.ts       # Инициализация сцены
└── index.ts       # Точка входа
```
