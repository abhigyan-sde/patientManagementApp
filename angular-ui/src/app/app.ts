import { Component, Renderer2, NgZone, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { electron } from './shared/electron';
import { IpcRendererEvent } from 'electron';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'angular-ui';
  isDarkMode = false;

  constructor(private renderer: Renderer2,
    private ngZone: NgZone
  ) {
    // Load from localStorage or system preference
    // const saved = localStorage.getItem('darkMode');
    // if (saved === 'true') {
    //   this.enableDarkMode();
    // }
  }
    ngOnInit() {
    if (electron.ipcRenderer) {
       electron.ipcRenderer.on('toggle-dark-mode', (event : IpcRendererEvent, isDarkMode: boolean) => {
        // Since this is a callback outside Angular zone, run inside zone to trigger change detection
        this.ngZone.run(() => {
          if (isDarkMode) {
            document.documentElement.classList.add('dark-theme');
          } else {
            document.documentElement.classList.remove('dark-theme');
          }
        });
      });
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.isDarkMode ? this.enableDarkMode() : this.disableDarkMode();
  }

  enableDarkMode() {
    this.renderer.addClass(document.documentElement, 'dark-theme');
  }

  disableDarkMode() {
    this.renderer.removeClass(document.documentElement, 'dark-theme');
  }


}
