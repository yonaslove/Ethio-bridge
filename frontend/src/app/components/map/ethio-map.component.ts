import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const L: any;

export interface MapMarkerItem {
  id?: string | number;
  title: string;
  subtitle?: string;
  lat: number;
  lng: number;
  badge?: string;
  linkUrl?: string;
}

export interface LocationSelectedEvent {
  lat: number;
  lng: number;
  address?: string;
}

@Component({
  selector: 'app-ethio-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-wrapper">
      <div class="map-toolbar">
        <div class="map-title-row">
          <span class="map-icon">🗺️</span>
          <strong>{{ title || 'Ethiopian Real-Time Interactive Map' }}</strong>
          <span class="marker-count" *ngIf="markers && markers.length > 0">({{ markers.length }} active pins)</span>
          <span class="geocoding-badge" *ngIf="isGeocoding">⚡ Locating address...</span>
        </div>

        <!-- Google Maps & Layer Toggle Bar -->
        <div class="layer-selector">
          <button type="button" class="layer-btn" [class.active]="currentLayer === 'google-hybrid'" (click)="switchLayer('google-hybrid')">
            🛰️ Google Satellite
          </button>
          <button type="button" class="layer-btn" [class.active]="currentLayer === 'google-streets'" (click)="switchLayer('google-streets')">
            🌐 Google Maps
          </button>
          <button type="button" class="layer-btn" [class.active]="currentLayer === 'osm'" (click)="switchLayer('osm')">
            🗺️ OpenStreetMap
          </button>
          <a *ngIf="selectedCoords" [href]="getGoogleMapsExternalUrl()" target="_blank" class="layer-btn btn-gmap-external" title="Open this exact location directly in Google Maps">
            📌 Open in Google Maps ↗
          </a>
        </div>
      </div>

      <!-- Quick Ethiopian Cities Hotbar -->
      <div class="quick-cities-bar">
        <span class="quick-label">Ethiopian Hubs:</span>
        <button type="button" class="city-pill" (click)="panToCity(9.0054, 38.7636, 13, 'Addis Ababa (Central)')">Addis Ababa</button>
        <button type="button" class="city-pill" (click)="panToCity(8.9950, 38.7890, 14, 'Bole / Airport')">Bole</button>
        <button type="button" class="city-pill" (click)="panToCity(9.0180, 38.7650, 14, 'Kazanchis')">Kazanchis</button>
        <button type="button" class="city-pill" (click)="panToCity(9.0340, 38.7520, 14, 'Piazza / Arada')">Piazza</button>
        <button type="button" class="city-pill" (click)="panToCity(8.5400, 39.2700, 13, 'Adama (Nazret)')">Adama</button>
        <button type="button" class="city-pill" (click)="panToCity(11.5900, 37.3900, 13, 'Bahir Dar')">Bahir Dar</button>
        <button type="button" class="city-pill" (click)="panToCity(7.0500, 38.4700, 13, 'Hawassa')">Hawassa</button>
        <button type="button" class="city-pill" (click)="panToCity(13.5000, 39.4700, 13, 'Mekelle')">Mekelle</button>
        <button type="button" class="city-pill" (click)="panToCity(9.6000, 41.8600, 13, 'Dire Dawa')">Dire Dawa</button>
        <button type="button" class="city-pill" (click)="panToCity(7.6700, 36.8300, 13, 'Jimma')">Jimma</button>
        <button type="button" class="city-pill" (click)="panToCity(8.7500, 38.9800, 13, 'Bishoftu')">Bishoftu</button>
      </div>

      <!-- Subbar for Pin status and coordinates -->
      <div class="map-subbar" *ngIf="allowPinSelection || selectedCoords">
        <div class="subbar-left">
          <span class="pin-hint">📍 Click anywhere on map or drag pin to fine-tune exact service/office location</span>
        </div>
        <div class="subbar-right" *ngIf="selectedCoords">
          <span class="pin-coords">GPS: {{ selectedCoords.lat.toFixed(5) }}, {{ selectedCoords.lng.toFixed(5) }}</span>
          <span class="pin-resolved-name" *ngIf="resolvedAddressName">{{ resolvedAddressName }}</span>
        </div>
      </div>

      <!-- The Leaflet Map container with Google Maps tiles -->
      <div #mapContainer class="leaflet-map-host" [style.height]="height || '380px'"></div>
    </div>
  `,
  styles: [`
    .map-wrapper {
      border: 1px solid var(--color-border, #CBD5E1);
      border-radius: 10px;
      overflow: hidden;
      background: #FFFFFF;
      margin: 1rem 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      font-family: inherit;
    }
    .map-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.9rem;
      background: #0F172A;
      color: #FFFFFF;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .map-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.88rem;
    }
    .marker-count {
      font-size: 0.72rem;
      color: #38BDF8;
      font-weight: 700;
      background: rgba(56, 189, 248, 0.15);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .geocoding-badge {
      font-size: 0.72rem;
      color: #FBBF24;
      background: rgba(251, 191, 36, 0.2);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-weight: 700;
      animation: pulse 1.2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .layer-selector {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      align-items: center;
    }
    .layer-btn {
      background: #1E293B;
      color: #E2E8F0;
      border: 1px solid #334155;
      padding: 0.25rem 0.6rem;
      font-size: 0.74rem;
      font-weight: 600;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s ease;
    }
    .layer-btn:hover {
      background: #334155;
      color: #FFFFFF;
    }
    .layer-btn.active {
      background: #0284C7;
      color: #FFFFFF;
      border-color: #38BDF8;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
    }
    .btn-gmap-external {
      background: #047857;
      color: #FFFFFF;
      border-color: #10B981;
    }
    .btn-gmap-external:hover {
      background: #059669;
    }
    .quick-cities-bar {
      display: flex;
      gap: 0.35rem;
      padding: 0.45rem 0.85rem;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      align-items: center;
      overflow-x: auto;
      white-space: nowrap;
    }
    .quick-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748B;
      margin-right: 0.25rem;
    }
    .city-pill {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      padding: 0.2rem 0.5rem;
      font-size: 0.72rem;
      border-radius: 4px;
      cursor: pointer;
      color: #334155;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .city-pill:hover {
      background: #0E7F8F;
      color: #FFFFFF;
      border-color: #0E7F8F;
    }
    .map-subbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F0FDF4;
      color: #166534;
      padding: 0.4rem 0.9rem;
      font-size: 0.75rem;
      border-bottom: 1px solid #BBF7D0;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .subbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .pin-coords {
      font-family: monospace;
      font-weight: 700;
      background: #FFFFFF;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      border: 1px solid #86EFAC;
      color: #15803D;
    }
    .pin-resolved-name {
      font-weight: 700;
      color: #0F172A;
      background: rgba(255,255,255,0.7);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .leaflet-map-host {
      width: 100%;
      min-height: 280px;
      background: #E2E8F0;
      position: relative;
    }
    :host ::ng-deep .custom-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: #0E7F8F;
      color: white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      border: 2px solid white;
    }
    :host ::ng-deep .custom-pin-inner {
      transform: rotate(45deg);
      font-size: 16px;
    }
    :host ::ng-deep .custom-pin-user {
      background: #EF4444 !important;
      animation: bounce 0.8s ease infinite alternate;
    }
    @keyframes bounce {
      0% { transform: rotate(-45deg) translateY(0); }
      100% { transform: rotate(-45deg) translateY(-6px); }
    }
    :host ::ng-deep .custom-pin-featured {
      background: #D97706 !important;
    }
  `]
})
export class EthioMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() title: string = '';
  @Input() height: string = '380px';
  @Input() initialLat: number = 9.0054;
  @Input() initialLng: number = 38.7636;
  @Input() initialZoom: number = 13;
  @Input() markers: MapMarkerItem[] = [];
  @Input() allowPinSelection: boolean = false;
  @Input() trackAddress: string = '';
  @Input() selectedLat?: number;
  @Input() selectedLng?: number;

  @Output() locationSelected = new EventEmitter<LocationSelectedEvent>();

  selectedCoords: { lat: number; lng: number } | null = null;
  resolvedAddressName: string = '';
  isGeocoding: boolean = false;
  currentLayer: 'google-hybrid' | 'google-streets' | 'osm' = 'google-hybrid';

  private map: any = null;
  private currentTileLayer: any = null;
  private markerLayerGroup: any = null;
  private selectedMarker: any = null;
  private retryCount = 0;
  private geocodeDebounceTimer: any = null;

  // Comprehensive Ethiopian geographic coordinates dictionary for instant zero-latency address lookup
  private static readonly ETHIO_GEO_DICT: Record<string, { lat: number; lng: number; zoom: number; label: string }> = {
    'addis ababa': { lat: 9.0054, lng: 38.7636, zoom: 13, label: 'Addis Ababa (Central)' },
    'addis': { lat: 9.0054, lng: 38.7636, zoom: 13, label: 'Addis Ababa' },
    'bole': { lat: 8.9950, lng: 38.7890, zoom: 14, label: 'Bole, Addis Ababa' },
    'kazanchis': { lat: 9.0180, lng: 38.7650, zoom: 15, label: 'Kazanchis, Addis Ababa' },
    'piazza': { lat: 9.0340, lng: 38.7520, zoom: 15, label: 'Piazza / Arada, Addis Ababa' },
    'piassa': { lat: 9.0340, lng: 38.7520, zoom: 15, label: 'Piazza / Arada, Addis Ababa' },
    'arada': { lat: 9.0340, lng: 38.7520, zoom: 15, label: 'Arada Sub-City, Addis Ababa' },
    'sarbet': { lat: 8.9950, lng: 38.7350, zoom: 15, label: 'Sarbet / Bisrate Gabriel, Addis Ababa' },
    'gerji': { lat: 9.0080, lng: 38.8150, zoom: 14, label: 'Gerji, Addis Ababa' },
    'cmc': { lat: 9.0190, lng: 38.8550, zoom: 14, label: 'CMC / Ayat, Addis Ababa' },
    'ayat': { lat: 9.0200, lng: 38.8650, zoom: 14, label: 'Ayat, Addis Ababa' },
    'megenagna': { lat: 9.0190, lng: 38.8020, zoom: 15, label: 'Megenagna, Addis Ababa' },
    'mexico': { lat: 9.0100, lng: 38.7450, zoom: 15, label: 'Mexico Square, Addis Ababa' },
    'summit': { lat: 9.0050, lng: 38.8680, zoom: 14, label: 'Summit, Addis Ababa' },
    'lebu': { lat: 8.9550, lng: 38.7180, zoom: 14, label: 'Lebu / Jemo, Addis Ababa' },
    'jemo': { lat: 8.9550, lng: 38.7180, zoom: 14, label: 'Jemo, Addis Ababa' },
    'kality': { lat: 8.9050, lng: 38.7700, zoom: 13, label: 'Kality, Addis Ababa' },
    'akaki': { lat: 8.8750, lng: 38.7850, zoom: 13, label: 'Akaki Kality, Addis Ababa' },
    'gullele': { lat: 9.0650, lng: 38.7300, zoom: 14, label: 'Gullele Sub-City, Addis Ababa' },
    'kirkos': { lat: 9.0100, lng: 38.7600, zoom: 14, label: 'Kirkos Sub-City, Addis Ababa' },
    'yeka': { lat: 9.0350, lng: 38.8050, zoom: 14, label: 'Yeka Sub-City, Addis Ababa' },
    'nifas silk': { lat: 8.9750, lng: 38.7450, zoom: 14, label: 'Nifas Silk Lafto, Addis Ababa' },
    'adama': { lat: 8.5400, lng: 39.2700, zoom: 13, label: 'Adama (Nazret), Oromia' },
    'nazret': { lat: 8.5400, lng: 39.2700, zoom: 13, label: 'Adama (Nazret), Oromia' },
    'bahir dar': { lat: 11.5900, lng: 37.3900, zoom: 13, label: 'Bahir Dar, Amhara' },
    'hawassa': { lat: 7.0500, lng: 38.4700, zoom: 13, label: 'Hawassa, Sidama' },
    'gondar': { lat: 12.6000, lng: 37.4667, zoom: 13, label: 'Gondar, Amhara' },
    'mekelle': { lat: 13.5000, lng: 39.4700, zoom: 13, label: 'Mekelle, Tigray' },
    'dire dawa': { lat: 9.6000, lng: 41.8600, zoom: 13, label: 'Dire Dawa' },
    'harar': { lat: 9.3100, lng: 42.1200, zoom: 14, label: 'Harar, Harari' },
    'jimma': { lat: 7.6700, lng: 36.8300, zoom: 13, label: 'Jimma, Oromia' },
    'bishoftu': { lat: 8.7500, lng: 38.9800, zoom: 13, label: 'Bishoftu (Debre Zeyit), Oromia' },
    'debre zeyit': { lat: 8.7500, lng: 38.9800, zoom: 13, label: 'Bishoftu (Debre Zeyit), Oromia' },
    'dessie': { lat: 11.1300, lng: 39.6300, zoom: 13, label: 'Dessie, Amhara' },
    'debre birhan': { lat: 9.6800, lng: 39.5300, zoom: 13, label: 'Debre Birhan, Amhara' },
    'wolaita sodo': { lat: 6.8600, lng: 37.7600, zoom: 13, label: 'Wolaita Sodo, South Ethiopia' },
    'sodo': { lat: 6.8600, lng: 37.7600, zoom: 13, label: 'Wolaita Sodo, South Ethiopia' },
    'arba minch': { lat: 6.0300, lng: 37.5500, zoom: 13, label: 'Arba Minch, South Ethiopia' },
    'shashemene': { lat: 7.2000, lng: 38.6000, zoom: 13, label: 'Shashemene, Oromia' },
    'asella': { lat: 7.9500, lng: 39.1300, zoom: 13, label: 'Asella, Oromia' },
    'nekemte': { lat: 9.0800, lng: 36.5500, zoom: 13, label: 'Nekemte, Oromia' },
    'dilla': { lat: 6.4100, lng: 38.3100, zoom: 13, label: 'Dilla, Gedeo' },
    'jijiga': { lat: 9.3500, lng: 42.8000, zoom: 13, label: 'Jijiga, Somali' },
    'gambela': { lat: 8.2500, lng: 34.5800, zoom: 13, label: 'Gambela' },
    'semera': { lat: 11.7900, lng: 41.0000, zoom: 13, label: 'Semera, Afar' },
    'kombolcha': { lat: 11.0800, lng: 39.7400, zoom: 13, label: 'Kombolcha, Amhara' },
    'axum': { lat: 14.1200, lng: 38.7200, zoom: 14, label: 'Axum, Tigray' },
    'lalibela': { lat: 12.0300, lng: 39.0400, zoom: 14, label: 'Lalibela, Amhara' }
  };

  ngAfterViewInit(): void {
    this.ensureLeafletLoaded().then(() => {
      this.initMap();
      if (this.selectedLat && this.selectedLng) {
        this.selectedCoords = { lat: this.selectedLat, lng: this.selectedLng };
        this.updateUserPin(this.selectedLat, this.selectedLng);
      }
      if (this.trackAddress) {
        this.triggerAddressGeocode(this.trackAddress);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['markers']) {
      this.renderMarkers();
    }
    if (changes['trackAddress'] && changes['trackAddress'].currentValue) {
      const newAddress = changes['trackAddress'].currentValue;
      if (newAddress.trim()) {
        clearTimeout(this.geocodeDebounceTimer);
        this.geocodeDebounceTimer = setTimeout(() => {
          this.triggerAddressGeocode(newAddress);
        }, 350);
      }
    }
    if ((changes['selectedLat'] || changes['selectedLng']) && this.map) {
      if (this.selectedLat && this.selectedLng) {
        this.selectedCoords = { lat: this.selectedLat, lng: this.selectedLng };
        this.updateUserPin(this.selectedLat, this.selectedLng);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {}
      this.map = null;
    }
  }

  private ensureLeafletLoaded(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).L) {
        resolve();
        return;
      }

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        script.onerror = () => {
          console.warn('Leaflet script failed to load from primary CDN');
          resolve();
        };
        document.head.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 3000);
      }
    });
  }

  private initMap(): void {
    if (!this.mapContainer || typeof window === 'undefined') return;

    const L_GLOBAL = (window as any).L;
    if (!L_GLOBAL) {
      if (this.retryCount < 10) {
        this.retryCount++;
        setTimeout(() => this.initMap(), 250);
      }
      return;
    }

    try {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      const initialLat = this.selectedLat || this.initialLat || 9.0054;
      const initialLng = this.selectedLng || this.initialLng || 38.7636;

      this.map = L_GLOBAL.map(this.mapContainer.nativeElement, {
        zoomControl: true,
        attributionControl: true
      }).setView([initialLat, initialLng], this.initialZoom || 13);

      this.applyTileLayer();

      this.markerLayerGroup = L_GLOBAL.layerGroup().addTo(this.map);

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);

      if (this.allowPinSelection) {
        this.map.on('click', (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          this.selectedCoords = { lat, lng };
          this.updateUserPin(lat, lng, true);
          this.locationSelected.emit({ lat, lng, address: this.resolvedAddressName });
        });
      }

      this.renderMarkers();
    } catch (e) {
      console.warn('Map initialization error:', e);
    }
  }

  switchLayer(layer: 'google-hybrid' | 'google-streets' | 'osm'): void {
    this.currentLayer = layer;
    this.applyTileLayer();
  }

  private applyTileLayer(): void {
    const L_GLOBAL = (window as any).L;
    if (!this.map || !L_GLOBAL) return;

    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
      this.currentTileLayer = null;
    }

    if (this.currentLayer === 'google-hybrid') {
      // Real Google Satellite + Streets & Place Names Hybrid Layer
      this.currentTileLayer = L_GLOBAL.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps | EthioBridge Ethiopia Real Satellite',
        maxZoom: 20
      }).addTo(this.map);
    } else if (this.currentLayer === 'google-streets') {
      // Real Google Maps Standard Street Layer
      this.currentTileLayer = L_GLOBAL.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: '&copy; Google Maps | EthioBridge Ethiopia Real Streets',
        maxZoom: 20
      }).addTo(this.map);
    } else {
      // OpenStreetMap Layer
      this.currentTileLayer = L_GLOBAL.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | EthioBridge',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(this.map);
    }
  }

  triggerAddressGeocode(addressText: string): void {
    if (!addressText || !addressText.trim()) return;
    const clean = addressText.trim().toLowerCase();

    // 1. Instant check against Ethiopian geographic dictionary
    for (const [key, val] of Object.entries(EthioMapComponent.ETHIO_GEO_DICT)) {
      if (clean.includes(key) || key.includes(clean)) {
        this.resolvedAddressName = val.label;
        this.panToCity(val.lat, val.lng, val.zoom, val.label);
        this.selectedCoords = { lat: val.lat, lng: val.lng };
        this.updateUserPin(val.lat, val.lng);
        this.locationSelected.emit({ lat: val.lat, lng: val.lng, address: val.label });
        return;
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim for exact woreda, street or building in Ethiopia
    this.isGeocoding = true;
    const encoded = encodeURIComponent(addressText.trim() + ', Ethiopia');
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=et&limit=1&q=${encoded}`;

    if (typeof fetch !== 'undefined') {
      fetch(url)
        .then(res => res.json())
        .then(data => {
          this.isGeocoding = false;
          if (Array.isArray(data) && data.length > 0) {
            const first = data[0];
            const lat = parseFloat(first.lat);
            const lng = parseFloat(first.lon);
            const label = first.display_name.split(',')[0] || addressText;
            this.resolvedAddressName = label;
            this.panToCity(lat, lng, 15, label);
            this.selectedCoords = { lat, lng };
            this.updateUserPin(lat, lng);
            this.locationSelected.emit({ lat, lng, address: label });
          }
        })
        .catch(() => {
          this.isGeocoding = false;
        });
    } else {
      this.isGeocoding = false;
    }
  }

  updateUserPin(lat: number, lng: number, emit: boolean = false): void {
    const L_GLOBAL = (window as any).L;
    if (!this.map || !L_GLOBAL) return;

    if (this.selectedMarker) {
      this.selectedMarker.setLatLng([lat, lng]);
    } else {
      const pinHtml = `<div class="custom-pin custom-pin-user"><span class="custom-pin-inner">📍</span></div>`;
      const customIcon = L_GLOBAL.divIcon({
        className: '',
        html: pinHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
      });

      this.selectedMarker = L_GLOBAL.marker([lat, lng], {
        icon: customIcon,
        draggable: true
      }).addTo(this.map);

      this.selectedMarker.on('dragend', (de: any) => {
        const pos = de.target.getLatLng();
        this.selectedCoords = { lat: pos.lat, lng: pos.lng };
        this.locationSelected.emit({ lat: pos.lat, lng: pos.lng, address: this.resolvedAddressName });
      });
    }

    const popupText = `
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
        <strong style="color: #EF4444; font-size: 13px;">📍 Your Service Location</strong>
        <p style="margin: 3px 0 0; color: #475569; font-size: 11px;">${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
        <div style="margin-top: 5px;">
          <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="color: #0284C7; font-weight: 700; font-size: 11px; text-decoration: underline;">Open in Google Maps ↗</a>
        </div>
      </div>
    `;
    this.selectedMarker.bindPopup(popupText);

    if (emit) {
      this.locationSelected.emit({ lat, lng, address: this.resolvedAddressName });
    }
  }

  panToCity(lat: number, lng: number, zoom: number, label?: string): void {
    if (this.map) {
      this.map.flyTo([lat, lng], zoom, { duration: 1.2 });
      if (label) {
        this.resolvedAddressName = label;
      }
      setTimeout(() => {
        if (this.map) this.map.invalidateSize();
      }, 150);
    }
  }

  getGoogleMapsExternalUrl(): string {
    if (!this.selectedCoords) {
      return `https://www.google.com/maps?q=9.0054,38.7636&z=13`;
    }
    return `https://www.google.com/maps?q=${this.selectedCoords.lat},${this.selectedCoords.lng}&z=16`;
  }

  private renderMarkers(): void {
    const L_GLOBAL = (window as any).L;
    if (!this.map || !this.markerLayerGroup || !L_GLOBAL) return;

    this.markerLayerGroup.clearLayers();

    if (!this.markers || this.markers.length === 0) return;

    const bounds = L_GLOBAL.latLngBounds([]);

    for (const m of this.markers) {
      if (typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng)) {
        const isFeatured = m.badge?.includes('FEATURED') || m.badge?.includes('PRO');
        const pinHtml = `<div class="custom-pin ${isFeatured ? 'custom-pin-featured' : ''}"><span class="custom-pin-inner">${isFeatured ? '⭐' : '💼'}</span></div>`;
        const icon = L_GLOBAL.divIcon({
          className: '',
          html: pinHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        const marker = L_GLOBAL.marker([m.lat, m.lng], { icon });
        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
            <strong style="color: #0E7F8F; font-size: 14px; display: block; margin-bottom: 2px;">${m.title}</strong>
            ${m.badge ? `<div style="margin: 3px 0;"><span style="background: ${isFeatured ? '#FEF3C7' : '#E0F2FE'}; color: ${isFeatured ? '#B45309' : '#0369A1'}; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">${m.badge}</span></div>` : ''}
            ${m.subtitle ? `<div style="color: #475569; font-size: 12px; margin-top: 4px;">${m.subtitle}</div>` : ''}
            <div style="margin-top: 6px; display: flex; gap: 8px;">
              ${m.linkUrl ? `<a href="${m.linkUrl}" style="color: #0E7F8F; font-weight: 700; font-size: 12px; text-decoration: underline;">View Details →</a>` : ''}
              <a href="https://www.google.com/maps?q=${m.lat},${m.lng}" target="_blank" style="color: #0284C7; font-weight: 700; font-size: 12px; text-decoration: underline;">Google Maps ↗</a>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);
        this.markerLayerGroup.addLayer(marker);
        bounds.extend([m.lat, m.lng]);
      }
    }

    if (this.markers.length > 1 && bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    } else if (this.markers.length === 1) {
      this.map.setView([this.markers[0].lat, this.markers[0].lng], 13);
    }

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 150);
  }
}
