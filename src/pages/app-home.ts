import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/radio-player.js';

@customElement('app-home')
export class AppHome extends LitElement {

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    radio-player {
      display: block;
      width: 100%;
      height: 100vh;
    }
  `;

  render() {
    return html`
      <radio-player></radio-player>
    `;
  }
}
