export interface RadioStation {
  id: string;
  name: string;
  nameEn: string;
  url: string;
  fallbackUrl?: string;
  alternativeUrls?: string[];
  logo: string;
  iconClass?: string;
  description: string;
}

export interface RadioState {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

export class RadioService extends EventTarget {
  private audioPlayer: HTMLAudioElement;
  private state: RadioState;

  constructor() {
    super();
    this.audioPlayer = new Audio();
    this.state = {
      currentStation: null,
      isPlaying: false,
      volume: 70,
      isLoading: false,
      error: null
    };
    
    this.setupAudioEvents();
  }

  private setupAudioEvents() {
    this.audioPlayer.addEventListener('loadstart', () => this.updateState({ isLoading: true, error: null }));
    this.audioPlayer.addEventListener('canplay', () => this.updateState({ isLoading: false }));
    this.audioPlayer.addEventListener('playing', () => {
      this.updateState({ isPlaying: true, isLoading: false });
      this.updateMediaSession();
    });
    this.audioPlayer.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
      this.updateMediaSession();
    });
    this.audioPlayer.addEventListener('error', (e) => this.handleError(e));
    this.audioPlayer.addEventListener('waiting', () => this.updateState({ isLoading: true }));
  }

  private updateState(newState: Partial<RadioState>) {
    this.state = { ...this.state, ...newState };
    this.dispatchEvent(new CustomEvent('statechange', { detail: this.state }));
  }

  private handleError(e: Event) {
    console.error('Audio error:', e);
    const target = e.target as HTMLAudioElement;
    
    let errorMessage = 'فشل في تشغيل المحطة.';
    
    if (target?.error?.code) {
      switch (target.error.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = 'تم إلغاء التشغيل.';
          break;
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت.';
          break;
        case 3: // MEDIA_ERR_DECODE
          errorMessage = 'خطأ في فك تشفير الصوت.';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = 'تنسيق الصوت غير مدعوم أو المحطة غير متاحة.';
          break;
        default:
          errorMessage = 'خطأ غير معروف في التشغيل.';
      }
    }

    this.updateState({ 
      isPlaying: false, 
      isLoading: false, 
      error: errorMessage + ' جرب محطة أخرى.' 
    });
  }

  async selectStation(station: RadioStation) {
    if (this.state.currentStation?.id === station.id && this.state.isPlaying) {
      this.togglePlayPause();
      return;
    }

    this.updateState({ currentStation: station, error: null });
    
    // Always start playing when selecting a new station
    await this.playStation();
  }

  async playStation() {
    if (!this.state.currentStation) return;
    
    try {
      this.updateState({ isLoading: true, error: null });
      
      // Stop current audio
      this.audioPlayer.pause();
      this.audioPlayer.currentTime = 0;
      this.audioPlayer.src = '';
      
      // For Chaine Inter, try multiple URLs due to streaming issues
      if (this.state.currentStation.id === 'snrt_inter') {
        await this.tryMultipleUrls();
      } else {
        // Try primary URL first for other stations
        await this.tryPlayUrl(this.state.currentStation.url);
      }
      
    } catch (error) {
      console.error('Primary URL failed:', error);
      
      // Try fallback URL if available
      if (this.state.currentStation.fallbackUrl) {
        try {
          console.log('Trying fallback URL...');
          await this.tryPlayUrl(this.state.currentStation.fallbackUrl);
        } catch (fallbackError) {
          console.error('Fallback URL also failed:', fallbackError);
          this.handlePlayError();
        }
      } else {
        this.handlePlayError();
      }
    }
  }

  private async tryMultipleUrls(): Promise<void> {
    const station = this.state.currentStation!;
    const allUrls = [
      station.url,
      ...(station.alternativeUrls || []),
      ...(station.fallbackUrl ? [station.fallbackUrl] : [])
    ];

    console.log(`Trying ${allUrls.length} URLs for ${station.name}...`);

    for (let i = 0; i < allUrls.length; i++) {
      const url = allUrls[i];
      console.log(`Attempting URL ${i + 1}/${allUrls.length}: ${url}`);
      
      try {
        await this.tryPlayUrl(url);
        console.log(`Success with URL ${i + 1}: ${url}`);
        return; // Success, exit the loop
      } catch (error) {
        console.error(`URL ${i + 1} failed:`, error);
        if (i === allUrls.length - 1) {
          // All URLs failed
          throw new Error('All stream URLs failed');
        }
        // Continue to next URL
      }
    }
  }

  private async tryPlayUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = this.audioPlayer;
      
      const onCanPlay = () => {
        cleanup();
        audio.volume = this.state.volume / 100;
        audio.play().then(resolve).catch(reject);
      };
      
      const onError = (e: Event) => {
        cleanup();
        console.log(`Failed to load URL: ${url}`);
        console.log('Error details:', e);
        reject(new Error(`Failed to load: ${(e as any).type}`));
      };
      
      const cleanup = () => {
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
      };
      
      // Add temporary event listeners
      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });
      
      // Set source and load
      audio.src = url;
      audio.load();
      
      // Timeout after 15 seconds
      setTimeout(() => {
        cleanup();
        reject(new Error('Connection timeout'));
      }, 15000);
    });
  }

  private handlePlayError() {
    this.updateState({
      isPlaying: false,
      isLoading: false,
      error: 'فشل في تشغيل المحطة. جرب محطة أخرى أو تحقق من اتصالك بالإنترنت.'
    });
  }

  async togglePlayPause() {
    if (!this.state.currentStation) return;
    
    if (this.state.isPlaying) {
      this.audioPlayer.pause();
    } else {
      await this.playStation();
    }
  }

  setVolume(volume: number) {
    this.state.volume = volume;
    this.audioPlayer.volume = volume / 100;
    this.updateState({ volume });
  }

  private updateMediaSession() {
    if ('mediaSession' in navigator && this.state.currentStation) {
      const metadata = {
        title: this.state.currentStation.name,
        artist: this.state.currentStation.description,
        album: 'راديو المغرب - Nexus Radio',
        artwork: [
          { src: '/assets/icons/192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/assets/icons/512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      };

      (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata(metadata);

      // Set up action handlers
      const actions: Array<[string, () => void]> = [
        ['play', () => this.playStation()],
        ['pause', () => this.audioPlayer.pause()],
        ['stop', () => { this.audioPlayer.pause(); this.audioPlayer.currentTime = 0; }],
        ['seekbackward', () => {}], // Not applicable for radio
        ['seekforward', () => {}],  // Not applicable for radio
        ['previoustrack', () => this.switchToPreviousStation()],
        ['nexttrack', () => this.switchToNextStation()]
      ];

      actions.forEach(([action, handler]) => {
        try {
          (navigator as any).mediaSession.setActionHandler(action, handler);
        } catch (error) {
          console.log(`Action ${action} not supported`);
        }
      });

      // Set playback state
      (navigator as any).mediaSession.playbackState = this.state.isPlaying ? 'playing' : 'paused';
    }
  }

  private switchToPreviousStation() {
    const stations = radioStations;
    if (!this.state.currentStation) return;
    
    const currentIndex = stations.findIndex(s => s.id === this.state.currentStation!.id);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : stations.length - 1;
    this.selectStation(stations[previousIndex]);
  }

  private switchToNextStation() {
    const stations = radioStations;
    if (!this.state.currentStation) return;
    
    const currentIndex = stations.findIndex(s => s.id === this.state.currentStation!.id);
    const nextIndex = currentIndex < stations.length - 1 ? currentIndex + 1 : 0;
    this.selectStation(stations[nextIndex]);
  }

  getState(): RadioState {
    return { ...this.state };
  }

  async testAudio(): Promise<boolean> {
    try {
      // Test with a simple, reliable audio file
      const testUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
      const testAudio = new Audio();
      testAudio.volume = 0.1;
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Test timeout')), 5000);
        
        testAudio.addEventListener('canplay', () => {
          clearTimeout(timeout);
          resolve(undefined);
        }, { once: true });
        
        testAudio.addEventListener('error', (e) => {
          clearTimeout(timeout);
          reject(e);
        }, { once: true });
        
        testAudio.src = testUrl;
        testAudio.load();
      });
      
      await testAudio.play();
      testAudio.pause();
      testAudio.src = '';
      
      return true;
    } catch (error) {
      console.error('Audio test failed:', error);
      return false;
    }
  }
}

export const radioStations: RadioStation[] = [
  // Moroccan Radio Stations
  {
    id: 'mfm_radio',
    name: 'إم إف إم راديو',
    nameEn: 'MFM Radio',
    url: 'https://a5.asurahosting.com:7980/radio.mp3',
    logo: '📡',
    iconClass: 'fas fa-broadcast-tower',
    description: 'راديو إم إف إم المغربي • Moroccan MFM Radio'
  },
  {
    id: 'hit_radio',
    name: 'هيت راديو',
    nameEn: 'Hit Radio',
    url: 'https://hitradio-maroc.ice.infomaniak.ch/hitradio-maroc-128.mp3',
    logo: '🎶',
    iconClass: 'fas fa-music',
    description: 'موسيقى عصرية ومتنوعة • Modern & Diverse Music'
  },
  {
    id: 'atlantic_radio',
    name: 'راديو أطلنطيك',
    nameEn: 'Atlantic Radio',
    url: 'https://atlantic-radio.ice.infomaniak.ch/atlantic-radio-128.mp3',
    fallbackUrl: 'https://str0.creacast.com/atlantic',
    logo: '🌊',
    iconClass: 'fas fa-wave-square',
    description: 'راديو أطلنطيك من المغرب • Atlantic Radio Morocco'
  },
  {
    id: 'uradio',
    name: 'يو راديو',
    nameEn: 'U Radio',
    url: 'https://uradio-aac.ice.infomaniak.ch/uradio.aac',
    logo: '🔥',
    iconClass: 'fas fa-fire',
    description: 'راديو الشباب المغربي • Moroccan Youth Radio'
  },
  {
    id: 'aswat',
    name: 'أصوات',
    nameEn: 'Aswat',
    url: 'https://aswat.ice.infomaniak.ch/aswat-high.mp3',
    logo: '🎙️',
    iconClass: 'fas fa-microphone',
    description: 'برامج ثقافية ومتنوعة • Cultural & Diverse Programs'
  },
  {
    id: 'snrt_inter',
    name: 'إذاعة شاين إنتر',
    nameEn: 'SNRT Chaine Inter',
    url: 'https://stream.zeno.fm/7wtwuby8vzruv',
    fallbackUrl: 'https://listen.radioking.com/radio/52812/stream/93256',
    logo: '🇲🇦',
    iconClass: 'fas fa-flag',
    description: 'الإذاعة الوطنية المغربية • Moroccan National Radio',
    alternativeUrls: [
      'https://radio.snrtlive.ma/SNRT-INTER/tracks-v1a1/mono.m3u8',
      'https://stream.radiointer.ma/radiointer.mp3',
      'https://chaineinter.radioca.st/stream',
      'https://streaming.radio.co/s38fef8c13/listen',
      'http://stream.radiointer.ma:8000/radiointer'
    ]
  },
  {
    id: 'radio_mars',
    name: 'راديو مارس',
    nameEn: 'Radio Mars',
    url: 'https://stream.radiojar.com/radiomars',
    fallbackUrl: 'https://mars.ice.infomaniak.ch/mars-128.mp3',
    logo: '🔴',
    iconClass: 'fas fa-globe-africa',
    description: 'راديو مارس المغربي • Mars Radio Morocco'
  },

  // French Radio Stations
  {
    id: 'rtl_france',
    name: 'آر تي إل فرنسا',
    nameEn: 'RTL France',
    url: 'https://streaming.radio.rtl.fr/rtl-1-44-128',
    fallbackUrl: 'https://rtl.ice.infomaniak.ch/rtl-fr-high.mp3',
    logo: '🇫🇷',
    iconClass: 'fas fa-tower-broadcast',
    description: 'راديو آر تي إل الفرنسي • French RTL Radio'
  },
  {
    id: 'europe1',
    name: 'أوروبا 1',
    nameEn: 'Europe 1',
    url: 'https://ais-live.cloud-services.paris:8443/europe1.mp3',
    fallbackUrl: 'https://stream.europe1.fr/europe1.mp3',
    logo: '📻',
    iconClass: 'fas fa-satellite-dish',
    description: 'راديو أوروبا 1 الفرنسي • Europe 1 French Radio'
  },
  {
    id: 'rfi_monde',
    name: 'آر إف آي العالمية',
    nameEn: 'RFI Monde',
    url: 'https://rfiafrique64k.ice.infomaniak.ch/rfiafrique-64.mp3',
    fallbackUrl: 'https://live02.rfi.fr/rfienmandarin-64.mp3',
    logo: '🌍',
    iconClass: 'fas fa-globe',
    description: 'راديو فرنسا الدولية • Radio France International'
  },
  {
    id: 'france_inter',
    name: 'فرنسا إنتر',
    nameEn: 'France Inter',
    url: 'https://stream.radiofrance.fr/franceinter/franceinter_hifi.m3u8',
    fallbackUrl: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    logo: '🎭',
    iconClass: 'fas fa-theater-masks',
    description: 'راديو فرنسا إنتر • France Inter Radio'
  },

  // Talk Radio Stations
  {
    id: 'bbc_world',
    name: 'بي بي سي العالمية',
    nameEn: 'BBC World Service',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
    fallbackUrl: 'https://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/nonuk/sbr_low/ak/bbc_world_service.m3u8',
    logo: '📰',
    iconClass: 'fas fa-newspaper',
    description: 'خدمة بي بي سي العالمية • BBC World Service'
  },
  {
    id: 'cnn_radio',
    name: 'سي إن إن راديو',
    nameEn: 'CNN Radio',
    url: 'https://tunein.com/radio/CNN-s20073/',
    fallbackUrl: 'https://streams.cnn.com/cnn-radio',
    logo: '📺',
    iconClass: 'fas fa-tv',
    description: 'أخبار سي إن إن • CNN News Radio'
  },
  {
    id: 'npr_news',
    name: 'إن بي آر الأخبار',
    nameEn: 'NPR News',
    url: 'https://npr-ice.streamguys1.com/live.mp3',
    fallbackUrl: 'https://stream.npr.org/npr-news.mp3',
    logo: '🗞️',
    iconClass: 'fas fa-file-alt',
    description: 'راديو الأخبار العامة • National Public Radio'
  },
  {
    id: 'radio_24',
    name: 'راديو 24 الأخبار',
    nameEn: 'Radio 24 News',
    url: 'https://ilsole24ore-radio.akamaized.net/hls/live/2035106/radio24/index.m3u8',
    fallbackUrl: 'https://radio24.ilsole24ore.com/radio24.mp3',
    logo: '⏰',
    iconClass: 'fas fa-clock',
    description: 'أخبار على مدار الساعة • 24/7 News Coverage'
  },

  // Music & Entertainment
  {
    id: 'lofi_station',
    name: 'لو فاي',
    nameEn: 'Lo-Fi Station',
    url: 'https://stream.lofihiphop.com/lofi',
    fallbackUrl: 'https://streams.fluxfm.de/Lounge/mp3-320',
    logo: '🎧',
    iconClass: 'fas fa-headphones',
    description: 'موسيقى هادئة للاسترخاء • Relaxing Lo-Fi Music'
  },
  {
    id: 'jazz_station',
    name: 'جاز',
    nameEn: 'Jazz Station',
    url: 'https://jazz-wr01.ice.infomaniak.ch/jazz-wr01-128.mp3',
    fallbackUrl: 'https://streaming.exclusive.radio/jazz/128',
    logo: '🎷',
    iconClass: 'fas fa-drum',
    description: 'موسيقى الجاز الكلاسيكية • Classical Jazz Music'
  },
  {
    id: 'classical_music',
    name: 'الموسيقى الكلاسيكية',
    nameEn: 'Classical Music',
    url: 'https://stream.radioparadise.com/rock-320',
    fallbackUrl: 'https://streams.classical-music.com/classical-128.mp3',
    logo: '🎼',
    iconClass: 'fas fa-music',
    description: 'موسيقى كلاسيكية راقية • Elegant Classical Music'
  }
];