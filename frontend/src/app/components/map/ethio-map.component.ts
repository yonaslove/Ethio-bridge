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
        </div>
        <div class="quick-zones">
          <button type="button" class="zone-btn" (click)="panToCity(9.0054, 38.7636, 13)">Addis (Central)</button>
          <button type="button" class="zone-btn" (click)="panToCity(8.9950, 38.7890, 14)">Bole / Airport</button>
          <button type="button" class="zone-btn" (click)="panToCity(9.0180, 38.7650, 14)">Kazanchis</button>
          <button type="button" class="zone-btn" (click)="panToCity(8.5400, 39.2700, 13)">Adama</button>
          <button type="button" class="zone-btn" (click)="panToCity(11.5900, 37.3900, 13)">Bahir Dar</button>
          <button type="button" class="zone-btn" (click)="panToCity(7.0500, 38.4700, 13)">Hawassa</button>
          <button type="button" class="zone-btn" (click)="panToCity(13.5000, 39.4700, 13)">Mekelle</button>
          <button type="button" class="zone-btn" (click)="panToCity(9.6000, 41.8600, 13)">Dire Dawa</button>
        </div>
      </div>
      <div class="map-subbar" *ngIf="allowPinSelection">
        <span class="pin-hint">📍 Click anywhere on the map to set physical service or job location</span>
        <span class="pin-coords" *ngIf="selectedCoords">{{ selectedCoords.lat.toFixed(4) }}, {{ selectedCoords.lng.toFixed(4) }}</span>
      </div>
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
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .map-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.9rem;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .map-title-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
      color: #0F172A;
    }
    .marker-count {
      font-size: 0.75rem;
      color: #0E7F8F;
      font-weight: 700;
      background: #E0F2FE;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }
    .quick-zones {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .zone-btn {
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
    .zone-btn:hover {
      background: #0E7F8F;
      color: #FFFFFF;
      border-color: #0E7F8F;
    }
    .map-subbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #EFF6FF;
      color: #1E40AF;
      padding: 0.35rem 0.9rem;
      font-size: 0.75rem;
      border-bottom: 1px solid #BFDBFE;
    }
    .pin-coords {
      font-family: monospace;
      font-weight: 700;
      background: white;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      border: 1px solid #93C5FD;
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
      width: 32px;
      height: 32px;
      background: #0E7F8F;
      color: white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      border: 2px solid white;
    }
    :host ::ng-deep .custom-pin-inner {
      transform: rotate(45deg);
      font-size: 14px;
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
  @Input() initialZoom: number = 12;
  @Input() markers: MapMarkerItem[] = [];
  @Input() allowPinSelection: boolean = false;

  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  selectedCoords: { lat: number; lng: number } | null = null;
  private map: any = null;
  private markerLayerGroup: any = null;
  private selectedMarker: any = null;
  private retryCount = 0;

  ngAfterViewInit(): void {
    this.ensureLeafletLoaded().then(() => {
      this.initMap();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['markers']) {
      this.renderMarkers();
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

      // Check if Leaflet CSS already in document
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Check if Leaflet script already in document
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

      this.map = L_GLOBAL.map(this.mapContainer.nativeElement, {
        zoomControl: true,
        attributionControl: true
      }).setView(
        [this.initialLat || 9.0054, this.initialLng || 38.7636],
        this.initialZoom || 12
      );

      // High-performance OpenStreetMap Standard Tiles
      L_GLOBAL.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | EthioBridge Ethiopia Maps',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(this.map);

      this.markerLayerGroup = L_GLOBAL.layerGroup().addTo(this.map);

      // Force recalculation of container dimensions to prevent grey tile rendering
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

          if (this.selectedMarker) {
            this.selectedMarker.setLatLng([lat, lng]);
          } else {
            const pinHtml = `<div class="custom-pin"><span class="custom-pin-inner">📍</span></div>`;
            const customIcon = L_GLOBAL.divIcon({
              className: '',
              html: pinHtml,
              iconSize: [32, 32],
              iconAnchor: [16, 32]
            });

            this.selectedMarker = L_GLOBAL.marker([lat, lng], {
              icon: customIcon,
              draggable: true
            }).addTo(this.map);

            this.selectedMarker.on('dragend', (de: any) => {
              const pos = de.target.getLatLng();
              this.selectedCoords = { lat: pos.lat, lng: pos.lng };
              this.locationSelected.emit(this.selectedCoords);
            });
          }
          this.locationSelected.emit({ lat, lng });
        });
      }

      this.renderMarkers();
    } catch (e) {
      console.warn('Map initialization error:', e);
    }
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
            ${m.linkUrl ? `<div style="margin-top: 6px;"><a href="${m.linkUrl}" style="color: #0E7F8F; font-weight: 700; font-size: 12px; text-decoration: underline;">View Details →</a></div>` : ''}
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

    // Always invalidate size after rendering markers to ensure crisp rendering
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 150);
  }

  panToCity(lat: number, lng: number, zoom: number): void {
    if (this.map) {
      this.map.setView([lat, lng], zoom);
      setTimeout(() => this.map.invalidateSize(), 100);
    }
  }
}
