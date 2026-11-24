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
          <strong>{{ title || 'Ethiopian Location Map' }}</strong>
          <span class="marker-count" *ngIf="markers && markers.length > 0">({{ markers.length }} pins)</span>
        </div>
        <div class="quick-zones">
          <button type="button" class="zone-btn" (click)="panToCity(9.0000, 38.7800, 12)">Addis Ababa</button>
          <button type="button" class="zone-btn" (click)="panToCity(8.5400, 39.2700, 13)">Adama</button>
          <button type="button" class="zone-btn" (click)="panToCity(11.5900, 37.3900, 13)">Bahir Dar</button>
          <button type="button" class="zone-btn" (click)="panToCity(7.0500, 38.4700, 13)">Hawassa</button>
          <button type="button" class="zone-btn" (click)="panToCity(13.5000, 39.4700, 13)">Mekelle</button>
          <button type="button" class="zone-btn" (click)="panToCity(9.6000, 41.8600, 13)">Dire Dawa</button>
        </div>
      </div>
      <div #mapContainer class="leaflet-map-host" [style.height]="height || '340px'"></div>
    </div>
  `,
  styles: [`
    .map-wrapper {
      border: 1px solid var(--color-border);
      border-radius: 10px;
      overflow: hidden;
      background: var(--color-surface);
      margin: 1rem 0;
      box-shadow: var(--shadow-sm);
    }
    .map-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.6rem 0.85rem;
      background: #F8FAFC;
      border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .map-title-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--color-charcoal);
    }
    .marker-count {
      font-size: 0.75rem;
      color: #64748B;
    }
    .quick-zones {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .zone-btn {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      padding: 0.2rem 0.45rem;
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
    .leaflet-map-host {
      width: 100%;
      min-height: 250px;
      background: #E2E8F0;
    }
  `]
})
export class EthioMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() title: string = '';
  @Input() height: string = '340px';
  @Input() initialLat: number = 9.0000;
  @Input() initialLng: number = 38.7800;
  @Input() initialZoom: number = 11;
  @Input() markers: MapMarkerItem[] = [];
  @Input() allowPinSelection: boolean = false;

  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  private map: any = null;
  private markerLayerGroup: any = null;
  private selectedMarker: any = null;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['markers']) {
      this.renderMarkers();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap(): void {
    if (!this.mapContainer || typeof window === 'undefined') return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet library is still loading...');
      return;
    }

    try {
      this.map = L.map(this.mapContainer.nativeElement).setView(
        [this.initialLat || 9.0000, this.initialLng || 38.7800],
        this.initialZoom || 11
      );

      // OpenStreetMap free tile server
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(this.map);

      this.markerLayerGroup = L.layerGroup().addTo(this.map);

      if (this.allowPinSelection) {
        this.map.on('click', (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          if (this.selectedMarker) {
            this.selectedMarker.setLatLng([lat, lng]);
          } else {
            this.selectedMarker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
            this.selectedMarker.on('dragend', (de: any) => {
              const pos = de.target.getLatLng();
              this.locationSelected.emit({ lat: pos.lat, lng: pos.lng });
            });
          }
          this.locationSelected.emit({ lat, lng });
        });
      }

      this.renderMarkers();
    } catch (e) {
      console.warn('Could not initialize map:', e);
    }
  }

  private renderMarkers(): void {
    if (!this.map || !this.markerLayerGroup || typeof L === 'undefined') return;

    this.markerLayerGroup.clearLayers();

    if (!this.markers || this.markers.length === 0) return;

    const bounds = L.latLngBounds([]);

    for (const m of this.markers) {
      if (typeof m.lat === 'number' && typeof m.lng === 'number' && !isNaN(m.lat) && !isNaN(m.lng)) {
        const marker = L.marker([m.lat, m.lng]);
        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
            <strong style="color: #0E7F8F; font-size: 14px;">${m.title}</strong>
            ${m.badge ? `<div style="margin: 3px 0;"><span style="background: #E0F2FE; color: #0369A1; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${m.badge}</span></div>` : ''}
            ${m.subtitle ? `<div style="color: #475569; font-size: 12px; margin-top: 3px;">${m.subtitle}</div>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
        this.markerLayerGroup.addLayer(marker);
        bounds.extend([m.lat, m.lng]);
      }
    }

    if (this.markers.length > 1 && bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    } else if (this.markers.length === 1) {
      this.map.setView([this.markers[0].lat, this.markers[0].lng], 13);
    }
  }

  panToCity(lat: number, lng: number, zoom: number): void {
    if (this.map) {
      this.map.setView([lat, lng], zoom);
    }
  }
}
