import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RadioService, RadioState, radioStations, type RadioStation } from '../services/radio-service.js';
import { AnalyticsService } from '../services/analytics-service.js';
import { SharingService } from '../services/sharing-service.js';
import { NotificationService } from '../services/notification-service.js';

@customElement('radio-player')
export class RadioPlayer extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Noto Sans Arabic', sans-serif;
      direction: rtl;
      text-align: right;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-attachment: fixed;
    }

    .player-container {
      max-width: 480px;
      margin: 0 auto;
      background: transparent;
      min-height: 100vh;
      overflow: hidden;
      position: relative;
      padding-bottom: 120px;
    }

    .player-container.no-player {
      padding-bottom: 0;
    }

    /* Header with glassmorphism effect */
    .header {
      background: rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: white;
      padding: 1.5rem 1rem;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .dark-mode-toggle {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dark-mode-toggle:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .help-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      font-size: 1rem;
      display: flex;
      align-items: center;
      margin-left: 0.5rem;
    }

    .help-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .share-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      padding: 0.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      font-size: 1rem;
      display: flex;
      align-items: center;
      margin-left: 0.5rem;
    }

    .share-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    /* Help Modal */
    .help-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
    }

    .help-modal.show {
      display: flex;
    }

    .help-content {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    }

    :host(.dark-mode) .help-content {
      background: #2d2d2d;
      color: white;
    }

    .help-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 1rem;
    }

    :host(.dark-mode) .help-header {
      border-color: #4a4a4a;
    }

    .help-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6c757d;
      padding: 0;
    }

    :host(.dark-mode) .help-close {
      color: #b0b0b0;
    }

    .shortcut-group {
      margin-bottom: 1.5rem;
    }

    .shortcut-group h4 {
      margin-bottom: 0.75rem;
      color: #c41e3a;
      font-size: 1rem;
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f8f9fa;
    }

    :host(.dark-mode) .shortcut-item {
      border-color: #3a3a3a;
    }

    .shortcut-key {
      background: #f8f9fa;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85rem;
      color: #2c3e50;
    }

    :host(.dark-mode) .shortcut-key {
      background: #3a3a3a;
      color: #ffffff;
    }

    .shortcut-desc {
      color: #6c757d;
      font-size: 0.9rem;
    }

    :host(.dark-mode) .shortcut-desc {
      color: #b0b0b0;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo i {
      font-size: 1.8rem;
      color: #ffd700;
    }

    .logo h1 {
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0;
    }

    .flag {
      font-size: 1.8rem;
      animation: wave 2s ease-in-out infinite;
    }

    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(-10deg); }
      75% { transform: rotate(10deg); }
    }

    /* Player Section */
    .player-section {
      padding: 2rem 1rem;
      text-align: center;
      background: white;
    }

    .current-station {
      margin-bottom: 2rem;
    }

    .station-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border: 1px solid #e9ecef;
    }

    .station-logo {
      width: 60px;
      height: 60px;
      background: #c41e3a;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      color: white;
      flex-shrink: 0;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', 'Android Emoji', 'EmojiSymbols', sans-serif;
      line-height: 1;
    }

    .station-logo-image {
      width: 72%;
      height: 72%;
      object-fit: contain;
      border-radius: 50%;
      background: white;
    }

    .station-logo-image + .emoji-icon {
      display: none;
    }

    .station-logo .icon-fallback {
      font-size: 1.5rem;
      font-family: 'Font Awesome 6 Free', 'Font Awesome 6 Pro', 'Font Awesome 5 Free', sans-serif;
      font-weight: 900;
    }

    .emoji-icon {
      display: inline-block;
      font-style: normal;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Hide fallback icons by default, show them via JS if emojis fail */
    .use-fallback-icons .emoji-icon {
      display: none;
    }

    .use-fallback-icons .icon-fallback {
      display: inline-block !important;
    }

    /* Ensure FontAwesome icons are always visible for controls */
    .fas, .fa-solid, .fa, .fab, .far {
      font-family: 'Font Awesome 6 Free', 'Font Awesome 6 Pro', 'Font Awesome 5 Free', sans-serif;
      font-weight: 900;
      font-style: normal;
      display: inline-block;
      text-rendering: auto;
      -webkit-font-smoothing: antialiased;
    }

    /* Fallback symbols if FontAwesome doesn't load */
    .fa-play:before { content: "▶"; }
    .fa-pause:before { content: "⏸"; }
    .fa-volume-down:before { content: "🔉"; }
    .fa-volume-up:before { content: "🔊"; }
    .fa-radio:before { content: "📻"; }
    .fa-share-alt:before { content: "🔗"; }
    .fa-question:before { content: "❓"; }
    .fa-sun:before { content: "☀️"; }
    .fa-moon:before { content: "🌙"; }
    .fa-smile:before { content: "😊"; }
    .fa-icons:before { content: "🎨"; }
    .fa-vial:before { content: "🧪"; }
    .fa-check:before { content: "✅"; }
    .fa-times:before { content: "❌"; }
    .fa-music:before { content: "🎵"; }
    .fa-microphone:before { content: "🎙️"; }
    .fa-fire:before { content: "🔥"; }
    .fa-headphones:before { content: "🎧"; }
    .fa-flag:before { content: "🇲🇦"; }
    .fa-drum:before { content: "🥁"; }
    .fa-broadcast-tower:before { content: "📡"; }

    /* Force symbol fallbacks when FontAwesome isn't working */
    .use-symbol-fallbacks .fas:before,
    .use-symbol-fallbacks .fa:before {
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif !important;
      font-weight: normal !important;
    }

    .use-symbol-fallbacks .icon-container .fas,
    .use-symbol-fallbacks .icon-container .fa {
      display: none;
    }

    .use-symbol-fallbacks .icon-container .symbol-fallback {
      display: inline-block !important;
      font-size: inherit;
      color: inherit;
    }

    .station-details {
      text-align: right;
      flex: 1;
    }

    .station-details h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
    }

    .station-details p {
      font-size: 0.9rem;
      color: #6c757d;
      margin: 0;
    }

    /* Player Controls */
    .player-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .play-btn {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #c41e3a 0%, #a91830 100%);
      color: white;
      font-size: 1.8rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .play-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .play-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .play-btn.playing {
      background: linear-gradient(135deg, #006233 0%, #004d29 100%);
    }

    .volume-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6c757d;
    }

    .volume-control i {
      color: #6c757d;
      font-size: 1rem;
    }

    .volume-slider {
      width: 100px;
      height: 4px;
      border-radius: 2px;
      outline: none;
      background: #e9ecef;
      -webkit-appearance: none;
      appearance: none;
    }

    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #c41e3a;
      cursor: pointer;
    }

    /* Equalizer */
    .equalizer {
      display: flex;
      justify-content: center;
      align-items: end;
      gap: 3px;
      height: 40px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .equalizer.active {
      opacity: 1;
    }

    .equalizer .bar {
      width: 4px;
      background: #c41e3a;
      border-radius: 2px;
      animation: equalizer 1s ease-in-out infinite;
    }

    .equalizer .bar:nth-child(1) { animation-delay: 0.1s; }
    .equalizer .bar:nth-child(2) { animation-delay: 0.2s; }
    .equalizer .bar:nth-child(3) { animation-delay: 0.3s; }
    .equalizer .bar:nth-child(4) { animation-delay: 0.4s; }
    .equalizer .bar:nth-child(5) { animation-delay: 0.5s; }

    @keyframes equalizer {
      0%, 100% { height: 10px; }
      50% { height: 30px; }
    }

    /* Stations Section */
    .stations-section {
      padding: 2rem 1rem;
      background: transparent;
      border: none;
    }

    .stations-section h3 {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
      font-weight: 700;
      font-size: 1.5rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .station-toolbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .station-search {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      flex: 1;
      min-width: 0;
      padding: 0.7rem 0.9rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.92);
      color: #6c757d;
    }

    .station-search input {
      width: 100%;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      color: #2c3e50;
      font: inherit;
    }

    .station-search input::placeholder {
      color: #7f8c8d;
    }

    .station-count {
      flex-shrink: 0;
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
      direction: ltr;
    }

    .test-info {
      font-size: 0.8rem;
      color: #6c757d;
      margin: 0;
    }

    .stations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1.5rem;
    }

    .station-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
    }

    .favorite-btn {
      position: absolute;
      top: 0.65rem;
      left: 0.65rem;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.72);
      color: #7f8c8d;
      cursor: pointer;
      z-index: 1;
    }

    .station-select {
      width: 100%;
      padding: 0;
      border: none;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: center;
      cursor: pointer;
    }

    .station-select:focus-visible,
    .favorite-btn:focus-visible {
      outline: 3px solid #ffd700;
      outline-offset: 3px;
    }

    .favorite-btn:hover,
    .favorite-btn.active {
      color: #c41e3a;
      background: white;
    }

    .station-card.active .favorite-btn {
      color: #c41e3a;
    }

    .station-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }

    .station-card:hover::before {
      transform: scaleX(1);
    }

    .station-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
      background: rgba(255, 255, 255, 0.95);
    }

    .station-card.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
    }

    .station-card.active::before {
      transform: scaleX(1);
      background: rgba(255, 255, 255, 0.3);
    }
      color: #2c3e50;
    }

    .station-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border-color: #c41e3a;
    }

    .station-card.active {
      border-color: #c41e3a;
      background: linear-gradient(135deg, #c41e3a 0%, #a91830 100%);
      color: white;
    }

    .station-card .station-logo {
      width: 50px;
      height: 50px;
      margin: 0 auto 0.5rem;
      font-size: 1.5rem;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', 'Android Emoji', 'EmojiSymbols', sans-serif;
      line-height: 1;
    }

    .station-card .station-logo .icon-fallback {
      font-size: 1.2rem;
      font-family: 'Font Awesome 6 Free', 'Font Awesome 6 Pro', 'Font Awesome 5 Free', sans-serif;
      font-weight: 900;
    }

    .station-card.active .station-logo {
      background: #ffd700;
      color: #c41e3a;
    }

    .station-card h4 {
      font-size: 0.9rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
    }

    .station-name-arabic {
      font-size: 0.9rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.1rem;
      direction: rtl;
      text-align: right;
      line-height: 1.2;
    }

    .station-name-english {
      font-size: 0.75rem;
      font-weight: 400;
      color: #6c757d;
      direction: ltr;
      text-align: left;
      line-height: 1.1;
    }

    .station-card p {
      font-size: 0.8rem;
      color: #6c757d;
      margin: 0;
    }

    /* Loading */
    .loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      z-index: 1000;
    }

    .loading.show {
      display: flex;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e9ecef;
      border-top: 4px solid #c41e3a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Error Message */
    .error-message {
      position: fixed;
      bottom: -100px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc3545;
      color: white;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: bottom 0.3s ease;
      z-index: 1000;
      max-width: 90%;
    }

    .error-message.show {
      bottom: 20px;
    }

    .error-message i {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      display: block;
    }

    .error-message button {
      background: white;
      color: #dc3545;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      margin-top: 0.5rem;
      cursor: pointer;
      font-weight: 600;
    }

    /* Icon fixes for visibility */
    .fas, .fa, [class*="fa-"] {
      color: inherit;
    }

    .station-logo .fas, .station-logo .fa {
      color: white;
    }

    .play-btn .fas, .play-btn .fa {
      color: white;
    }

    .header .fas, .header .fa {
      color: #ffd700;
    }

    .dark-mode-toggle .fas, .dark-mode-toggle .fa {
      color: white;
    }

    /* Dark Mode Styles */
    :host(.dark-mode) {
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      background-attachment: fixed;
    }

    :host(.dark-mode) .player-container {
      background: #1a1a1a;
      color: #ffffff;
    }

    :host(.dark-mode) .player-section {
      background: #2d2d2d;
    }

    :host(.dark-mode) .station-info {
      background: #3a3a3a;
      border-color: #4a4a4a;
    }

    :host(.dark-mode) .station-details h2 {
      color: #ffffff;
    }

    :host(.dark-mode) .station-details p {
      color: #b0b0b0;
    }

    :host(.dark-mode) .volume-control {
      color: #b0b0b0;
    }

    :host(.dark-mode) .volume-control i {
      color: #b0b0b0;
    }

    :host(.dark-mode) .stations-section {
      background: #2a2a2a;
      border-color: #4a4a4a;
    }

    :host(.dark-mode) .stations-section h3 {
      color: #ffffff;
    }

    :host(.dark-mode) .station-search {
      background: #3a3a3a;
      border-color: #4a4a4a;
    }

    :host(.dark-mode) .station-search input {
      color: #ffffff;
    }

    :host(.dark-mode) .station-search input::placeholder {
      color: #b0b0b0;
    }

    :host(.dark-mode) .test-info {
      color: #b0b0b0;
    }

    :host(.dark-mode) .station-card {
      background: #3a3a3a;
      border-color: #4a4a4a;
      color: #ffffff;
    }

    :host(.dark-mode) .station-card:hover {
      border-color: #c41e3a;
      background: #404040;
    }

    :host(.dark-mode) .station-card h4 {
      color: #ffffff;
    }

    :host(.dark-mode) .station-name-arabic {
      color: #ffffff;
    }

    :host(.dark-mode) .station-name-english {
      color: #b0b0b0;
    }

    :host(.dark-mode) .station-card p {
      color: #b0b0b0;
    }

    :host(.dark-mode) .favorite-btn {
      background: #2d2d2d;
      color: #b0b0b0;
    }

    :host(.dark-mode) .favorite-btn:hover,
    :host(.dark-mode) .favorite-btn.active {
      background: #ffffff;
      color: #c41e3a;
    }

    :host(.dark-mode) .loading {
      background: rgba(26, 26, 26, 0.9);
      color: #ffffff;
    }

    :host(.dark-mode) .spinner {
      border-color: #4a4a4a;
      border-top-color: #c41e3a;
    }

    /* Fixed Bottom Player */
    .fixed-player {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 480px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px 20px 0 0;
      padding: 1rem 1.5rem;
      box-shadow: 0 -8px 32px 0 rgba(31, 38, 135, 0.37);
      z-index: 1000;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .fixed-player.hidden {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
      pointer-events: none;
    }

    .fixed-player-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .fixed-player .station-logo {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      color: white;
      flex-shrink: 0;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Segoe UI Symbol', 'Android Emoji', 'EmojiSymbols', sans-serif;
    }

    .fixed-player-info {
      flex: 1;
      min-width: 0;
    }

    .fixed-player-info h4 {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .fixed-player .station-name-arabic {
      font-size: 0.95rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.1rem;
      direction: rtl;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .fixed-player .station-name-english {
      font-size: 0.75rem;
      font-weight: 400;
      color: #666;
      direction: ltr;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .fixed-player-info p {
      font-size: 0.8rem;
      color: #666;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .fixed-player-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-shrink: 0;
    }

    .fixed-player .play-pause-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fixed-player .play-pause-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .fixed-player .volume-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .fixed-player .volume-slider {
      width: 60px;
      height: 3px;
    }

    :host(.dark-mode) .fixed-player {
      background: rgba(30, 30, 30, 0.95);
    }

    :host(.dark-mode) .fixed-player-info h4 {
      color: white;
    }

    :host(.dark-mode) .fixed-player .station-name-arabic {
      color: white;
    }

    :host(.dark-mode) .fixed-player .station-name-english {
      color: #b0b0b0;
    }

    :host(.dark-mode) .fixed-player-info p {
      color: #b0b0b0;
    }

    @media (max-width: 480px) {
      .stations-grid {
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      }

      .player-controls {
        gap: 1rem;
      }

      .volume-control {
        flex-direction: column;
        gap: 0.25rem;
      }

      .volume-slider {
        width: 80px;
      }
    }
  `;

  @state()
  private radioState: RadioState = {
    currentStation: null,
    isPlaying: false,
    volume: 70,
    isLoading: false,
    error: null
  };

  @state()
  private isDarkMode: boolean = false;

  @state()
  private showHelp: boolean = false;

  @state()
  private showAdmin: boolean = false;

  @state()
  private useEmojiIcons: boolean = true;

  @state()
  private stationQuery: string = '';

  @state()
  private favoriteStationIds: string[] = [];

  private radioService = new RadioService();
  private analytics = AnalyticsService.getInstance();
  private notifications = NotificationService.getInstance();
  private boundStateChangeHandler = this.handleStateChange.bind(this);
  private boundKeyboardShortcutsHandler = this.handleKeyboardShortcuts.bind(this);
  private boundVisibilityChangeHandler = this.handleVisibilityChange.bind(this);

  connectedCallback() {
    super.connectedCallback();
    this.radioService.addEventListener('statechange', this.boundStateChangeHandler);

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('nexus-radio-dark-mode');
    this.isDarkMode = savedDarkMode === 'true';
    this.updateDarkModeClass();

    // Check for saved icon preference
    const savedIconPref = localStorage.getItem('nexus-radio-emoji-icons');
    this.useEmojiIcons = savedIconPref !== 'false'; // Default to true
    this.updateIconClass();

    const savedFavorites = localStorage.getItem('nexus-radio-favorites');
    if (savedFavorites) {
      try {
        const parsedFavorites: unknown = JSON.parse(savedFavorites);
        if (Array.isArray(parsedFavorites)) {
          this.favoriteStationIds = parsedFavorites.filter(
            (stationId): stationId is string => typeof stationId === 'string'
          );
        }
      } catch {
        this.favoriteStationIds = [];
      }
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', this.boundKeyboardShortcutsHandler);

    // Add visibility change handler for background playback
    document.addEventListener('visibilitychange', this.boundVisibilityChangeHandler);

    // Check emoji support and enable FontAwesome fallback if needed
    this.checkEmojiSupport();

    // Add global debugging function for testing streams
    (window as any).testRadioStream = async (url: string) => {
      console.log(`Testing stream: ${url}`);
      const audio = new Audio();
      return new Promise((resolve, reject) => {
        audio.addEventListener('canplay', () => {
          console.log(`✅ Stream works: ${url}`);
          audio.pause();
          resolve(true);
        });
        audio.addEventListener('error', (e) => {
          console.log(`❌ Stream failed: ${url}`, e);
          reject(e);
        });
        audio.src = url;
        audio.load();
      });
    };
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.radioService.removeEventListener('statechange', this.boundStateChangeHandler);
    document.removeEventListener('keydown', this.boundKeyboardShortcutsHandler);
    document.removeEventListener('visibilitychange', this.boundVisibilityChangeHandler);
  }

  private handleStateChange(event: Event) {
    const customEvent = event as CustomEvent<RadioState>;
    this.radioState = customEvent.detail;
  }

  private async handleStationSelect(station: RadioStation) {
    try {
      await this.radioService.selectStation(station);
      this.analytics.trackStationPlay(station.name);
      this.notifications.success(`تم تشغيل ${station.name} • Now playing ${station.nameEn}`);
    } catch (error) {
      this.notifications.error(`فشل في تشغيل ${station.name} • Failed to play ${station.nameEn}`);
      this.analytics.trackError('station_select_failed', station.name);
    }
  }

  private async handlePlayPause() {
    await this.radioService.togglePlayPause();
    this.analytics.trackFeatureUse('play_pause');
  }

  private handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.radioService.setVolume(parseInt(target.value));
  }

  private handleStationSearch(event: Event) {
    this.stationQuery = (event.target as HTMLInputElement).value;
  }

  private isFavorite(stationId: string) {
    return this.favoriteStationIds.includes(stationId);
  }

  private toggleFavorite(event: Event, station: RadioStation) {
    event.stopPropagation();

    if (this.isFavorite(station.id)) {
      this.favoriteStationIds = this.favoriteStationIds.filter(id => id !== station.id);
    } else {
      this.favoriteStationIds = [...this.favoriteStationIds, station.id];
    }

    localStorage.setItem('nexus-radio-favorites', JSON.stringify(this.favoriteStationIds));
    this.analytics.trackFeatureUse(`favorite_${this.isFavorite(station.id) ? 'added' : 'removed'}`);
  }

  private getVisibleStations() {
    const query = this.stationQuery.trim().toLocaleLowerCase();
    const matchingStations = query
      ? radioStations.filter(station => [station.name, station.nameEn, station.description]
        .some(value => value.toLocaleLowerCase().includes(query)))
      : [...radioStations];

    return matchingStations.sort((firstStation, secondStation) => {
      return Number(this.isFavorite(secondStation.id)) - Number(this.isFavorite(firstStation.id));
    });
  }

  private toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('nexus-radio-dark-mode', this.isDarkMode.toString());
    this.updateDarkModeClass();
    this.analytics.trackFeatureUse(`dark_mode_${this.isDarkMode ? 'enabled' : 'disabled'}`);
    this.notifications.info(this.isDarkMode ? 'تم تفعيل الوضع المظلم' : 'تم إلغاء الوضع المظلم');
  }

  private toggleIconStyle() {
    this.useEmojiIcons = !this.useEmojiIcons;
    localStorage.setItem('nexus-radio-emoji-icons', this.useEmojiIcons.toString());
    this.updateIconClass();
    this.analytics.trackFeatureUse(`icons_${this.useEmojiIcons ? 'emoji' : 'fontawesome'}`);
    this.notifications.info(this.useEmojiIcons ? 'تم تفعيل الرموز التعبيرية' : 'تم تفعيل أيقونات فونت أوسوم');
  }

  private updateDarkModeClass() {
    if (this.isDarkMode) {
      this.classList.add('dark-mode');
    } else {
      this.classList.remove('dark-mode');
    }
  }

  private updateIconClass() {
    if (this.useEmojiIcons) {
      this.classList.remove('use-fallback-icons');
    } else {
      this.classList.add('use-fallback-icons');
    }
  }

  private checkEmojiSupport() {
    // Simple emoji support detection
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.height = 10;
    ctx.textBaseline = 'top';
    ctx.font = '8px Arial';

    // Test with a common emoji
    ctx.fillText('🎵', 0, 0);
    const emojiData = ctx.getImageData(0, 0, 10, 10).data;

    // Check if anything was actually drawn (not just blank)
    let hasContent = false;
    for (let i = 3; i < emojiData.length; i += 4) {
      if (emojiData[i] > 0) {
        hasContent = true;
        break;
      }
    }

    // If emojis don't render properly, use FontAwesome
    if (!hasContent) {
      this.classList.add('use-fallback-icons');
    }

    // Ensure FontAwesome is loaded
    this.ensureFontAwesome();
  }

  private ensureFontAwesome() {
    // Check if FontAwesome is loaded by testing a known icon
    const testIcon = document.createElement('i');
    testIcon.className = 'fas fa-check';
    testIcon.style.position = 'absolute';
    testIcon.style.left = '-9999px';
    document.body.appendChild(testIcon);

    setTimeout(() => {
      const computedStyle = window.getComputedStyle(testIcon, '::before');
      const content = computedStyle.getPropertyValue('content');

      document.body.removeChild(testIcon);

      // If FontAwesome isn't loaded properly, add a fallback
      if (!content || content === 'none' || content === '""') {
        console.warn('FontAwesome not loaded properly, using symbol fallbacks');
        this.classList.add('use-symbol-fallbacks');
        this.addFontAwesomeFallback();
      }
    }, 100);
  }

  private addFontAwesomeFallback() {
    // Add a different FontAwesome CDN as fallback
    const fallbackLink = document.createElement('link');
    fallbackLink.rel = 'stylesheet';
    fallbackLink.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css';
    document.head.appendChild(fallbackLink);
  }

  private handleKeyboardShortcuts(event: KeyboardEvent) {
    // Don't interfere with form inputs
    if (event.target instanceof HTMLInputElement) return;

    switch (event.key.toLowerCase()) {
      case ' ': // Spacebar - Play/Pause
      case 'k':
        event.preventDefault();
        this.handlePlayPause();
        break;
      case 'arrowup':
        event.preventDefault();
        this.adjustVolume(10);
        break;
      case 'arrowdown':
        event.preventDefault();
        this.adjustVolume(-10);
        break;
      case 'arrowright':
      case 'n':
        event.preventDefault();
        this.switchToNextStation();
        break;
      case 'arrowleft':
      case 'p':
        event.preventDefault();
        this.switchToPreviousStation();
        break;
      case 'd':
        event.preventDefault();
        this.toggleDarkMode();
        break;
      case 'm':
        event.preventDefault();
        this.toggleMute();
        break;
      case 's':
        event.preventDefault();
        this.handleShare();
        break;
      case 'i':
        event.preventDefault();
        this.toggleIconStyle();
        break;
      case '?':
      case 'h':
        event.preventDefault();
        this.toggleHelp();
        break;
      case 'escape':
        if (this.showHelp) {
          event.preventDefault();
          this.toggleHelp();
        }
        if (this.showAdmin) {
          event.preventDefault();
          this.toggleAdmin();
        }
        break;
    }

    // Admin panel trigger (Ctrl+Shift+A)
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.toggleAdmin();
    }
  }

  private handleVisibilityChange() {
    // Optional: Implement behavior when app goes to background
    if (document.hidden) {
      console.log('App went to background, audio continues...');
    } else {
      console.log('App is visible again');
    }
  }

  private adjustVolume(delta: number) {
    const newVolume = Math.max(0, Math.min(100, this.radioState.volume + delta));
    this.radioService.setVolume(newVolume);
  }

  private switchToNextStation() {
    const stations = radioStations;
    if (!this.radioState.currentStation) return;

    const currentIndex = stations.findIndex(s => s.id === this.radioState.currentStation!.id);
    const nextIndex = currentIndex < stations.length - 1 ? currentIndex + 1 : 0;
    this.handleStationSelect(stations[nextIndex]);
  }

  private switchToPreviousStation() {
    const stations = radioStations;
    if (!this.radioState.currentStation) return;

    const currentIndex = stations.findIndex(s => s.id === this.radioState.currentStation!.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : stations.length - 1;
    this.handleStationSelect(stations[previousIndex]);
  }

  private savedVolume = 70;

  private toggleMute() {
    if (this.radioState.volume > 0) {
      this.savedVolume = this.radioState.volume;
      this.radioService.setVolume(0);
    } else {
      this.radioService.setVolume(this.savedVolume);
    }
  }

  private toggleHelp() {
    this.showHelp = !this.showHelp;
    this.analytics.trackFeatureUse(`help_${this.showHelp ? 'opened' : 'closed'}`);
  }

  private toggleAdmin() {
    this.showAdmin = !this.showAdmin;
    if (this.showAdmin) {
      this.analytics.trackFeatureUse('admin_panel_opened');
    }
  }

  private async handleShare() {
    try {
      const currentStation = this.radioState.currentStation;
      if (currentStation) {
        const result = await SharingService.shareStation(currentStation.name);
        this.analytics.trackFeatureUse(`share_station_${result}`);

        if (result === true) {
          this.notifications.success('تم مشاركة المحطة بنجاح!');
        } else if (result === 'clipboard') {
          this.notifications.info('تم نسخ رابط المحطة إلى الحافظة');
        } else {
          this.notifications.info('تم نسخ رابط المحطة');
        }
      } else {
        const result = await SharingService.shareApp();
        this.analytics.trackFeatureUse(`share_app_${result}`);

        if (result === true) {
          this.notifications.success('تم مشاركة التطبيق بنجاح!');
        } else if (result === 'clipboard') {
          this.notifications.info('تم نسخ رابط التطبيق إلى الحافظة');
        } else {
          this.notifications.info('تم نسخ رابط التطبيق');
        }
      }
    } catch (error) {
      this.notifications.error('فشل في المشاركة. حاول مرة أخرى');
      this.analytics.trackError('share_failed', error instanceof Error ? error.message : 'unknown');
    }
  }

  private renderStationIcon(station: RadioStation) {
    return html`
      ${station.logoUrl ? html`
        <img
          class="station-logo-image"
          src=${station.logoUrl}
          alt=""
          loading="lazy"
          @error=${(event: Event) => (event.currentTarget as HTMLImageElement).remove()}
        >
      ` : ''}
      <span class="emoji-icon">${station.logo}</span>
      ${station.iconClass ? html`<i class="icon-fallback ${station.iconClass}" style="display: none;"></i>` : ''}
    `;
  }

  private renderIcon(iconClass: string, fallbackSymbol: string, title?: string) {
    return html`
      <span class="icon-container" title="${title || ''}">
        <i class="fas ${iconClass}"></i>
        <span class="symbol-fallback" style="display: none;">${fallbackSymbol}</span>
      </span>
    `;
  }

  render() {
    const visibleStations = this.getVisibleStations();

    return html`
      <div class="player-container ${!this.radioState.currentStation ? 'no-player' : ''}">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <div class="logo">
              <i class="fas fa-radio"></i>
              <h1>راديو المغرب</h1>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <button class="share-btn" @click=${this.handleShare} title="مشاركة الإذاعة">
                ${this.renderIcon('fa-share-alt', '🔗', 'مشاركة')}
              </button>
              <button class="help-btn" @click=${this.toggleHelp} title="مساعدة ولوحة المفاتيح">
                ${this.renderIcon('fa-question', '❓', 'مساعدة')}
              </button>
              <button class="dark-mode-toggle" @click=${this.toggleIconStyle} title="تبديل نوع الأيقونات">
                ${this.useEmojiIcons ?
                  this.renderIcon('fa-smile', '😊', 'رموز تعبيرية') :
                  this.renderIcon('fa-icons', '🎨', 'أيقونات')
                }
              </button>
              <button class="dark-mode-toggle" @click=${this.toggleDarkMode} title="تبديل الوضع المظلم">
                ${this.isDarkMode ?
                  this.renderIcon('fa-sun', '☀️', 'وضع فاتح') :
                  this.renderIcon('fa-moon', '🌙', 'وضع مظلم')
                }
              </button>
              <div class="flag">🇲🇦</div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Stations List -->
          <div class="stations-section">
            <div class="station-toolbar">
              <label class="station-search">
                <i class="fas fa-search" aria-hidden="true"></i>
                <input
                  type="search"
                  aria-label="البحث عن محطة"
                  placeholder="ابحث عن محطة"
                  .value=${this.stationQuery}
                  @input=${this.handleStationSearch}
                >
              </label>
              <span class="station-count" aria-live="polite">${visibleStations.length} / ${radioStations.length}</span>
            </div>
            <div class="stations-grid">
              ${visibleStations.length === 0 ? html`<p class="test-info">لا توجد محطات مطابقة</p>` : visibleStations.map(station => html`
                <div
                  class="station-card ${this.radioState.currentStation?.id === station.id ? 'active' : ''}"
                  role="group"
                >
                  <button class="station-select" type="button" @click=${() => this.handleStationSelect(station)}>
                    <div class="station-logo">${this.renderStationIcon(station)}</div>
                    <h4>
                      <div class="station-name-arabic">${station.name}</div>
                      <div class="station-name-english">${station.nameEn}</div>
                    </h4>
                    <p>${station.description}</p>
                  </button>
                  <button
                    class="favorite-btn ${this.isFavorite(station.id) ? 'active' : ''}"
                    type="button"
                    aria-label=${this.isFavorite(station.id) ? `إزالة ${station.nameEn} من المفضلة` : `إضافة ${station.nameEn} إلى المفضلة`}
                    aria-pressed=${this.isFavorite(station.id)}
                    title=${this.isFavorite(station.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    @click=${(event: Event) => this.toggleFavorite(event, station)}
                  >
                    <i class="fas fa-star" aria-hidden="true"></i>
                  </button>
                </div>
              `)}
            </div>
          </div>
        </div>

        <!-- Fixed Bottom Player -->
        <div class="fixed-player ${!this.radioState.currentStation ? 'hidden' : ''}">
          <div class="fixed-player-content">
            <div class="station-logo">
              ${this.radioState.currentStation ? this.renderStationIcon(this.radioState.currentStation) : ''}
            </div>
            <div class="fixed-player-info">
              <h4>
                ${this.radioState.currentStation ? html`
                  <div class="station-name-arabic">${this.radioState.currentStation.name}</div>
                  <div class="station-name-english">${this.radioState.currentStation.nameEn}</div>
                ` : ''}
              </h4>
              <p>${this.getStatusText()}</p>
            </div>
            <div class="fixed-player-controls">
              <div class="volume-control">
                ${this.renderIcon('fa-volume-down', '🔉', 'صوت منخفض')}
                <input
                  type="range"
                  class="volume-slider"
                  min="0"
                  max="100"
                  .value=${this.radioState.volume.toString()}
                  @input=${this.handleVolumeChange}
                >
              </div>
              <button
                class="play-pause-btn"
                ?disabled=${!this.radioState.currentStation}
                @click=${this.handlePlayPause}
              >
                ${this.radioState.isPlaying ?
                  this.renderIcon('fa-pause', '⏸️', 'إيقاف') :
                  this.renderIcon('fa-play', '▶️', 'تشغيل')
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div class="loading ${this.radioState.isLoading ? 'show' : ''}">
          <div class="spinner"></div>
          <p>جاري التحميل...</p>
        </div>

        <!-- Error message -->
        <div class="error-message ${this.radioState.error ? 'show' : ''}">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${this.radioState.error}</p>
          <button @click=${() => this.radioService.togglePlayPause()}>إعادة المحاولة</button>
        </div>

        <!-- Help Modal -->
        <div class="help-modal ${this.showHelp ? 'show' : ''}">
          <div class="help-content">
            <div class="help-header">
              <h3>مساعدة ولوحة المفاتيح</h3>
              <button class="help-close" @click=${this.toggleHelp}>
                <i class="fas fa-times"></i>
              </button>
            </div>

            <div class="shortcut-group">
              <h4>🎵 تحكم في التشغيل</h4>
              <div class="shortcut-item">
                <span class="shortcut-desc">تشغيل/إيقاف</span>
                <span class="shortcut-key">Space / K</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">كتم الصوت</span>
                <span class="shortcut-key">M</span>
              </div>
            </div>

            <div class="shortcut-group">
              <h4>🔊 التحكم في الصوت</h4>
              <div class="shortcut-item">
                <span class="shortcut-desc">رفع الصوت</span>
                <span class="shortcut-key">↑</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">خفض الصوت</span>
                <span class="shortcut-key">↓</span>
              </div>
            </div>

            <div class="shortcut-group">
              <h4>📻 تغيير المحطات</h4>
              <div class="shortcut-item">
                <span class="shortcut-desc">المحطة التالية</span>
                <span class="shortcut-key">→ / N</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">المحطة السابقة</span>
                <span class="shortcut-key">← / P</span>
              </div>
            </div>

            <div class="shortcut-group">
              <h4>🎨 الإعدادات</h4>
              <div class="shortcut-item">
                <span class="shortcut-desc">الوضع المظلم</span>
                <span class="shortcut-key">D</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">تبديل نوع الأيقونات</span>
                <span class="shortcut-key">I</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">مشاركة الإذاعة</span>
                <span class="shortcut-key">S</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">إظهار المساعدة</span>
                <span class="shortcut-key">? / H</span>
              </div>
              <div class="shortcut-item">
                <span class="shortcut-desc">إغلاق المساعدة</span>
                <span class="shortcut-key">Esc</span>
              </div>
            </div>

            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e9ecef; text-align: center; color: #6c757d; font-size: 0.85rem;">
              راديو المغرب - Nexus Radio v2.0
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getStatusText(): string {
    if (this.radioState.isLoading) return 'جاري الاتصال...';
    if (this.radioState.isPlaying) return 'يتم التشغيل الآن';
    if (this.radioState.error) return 'خطأ في الاتصال';
    if (this.radioState.currentStation) return 'جاهز للتشغيل';
    return 'غير متصل';
  }
}