import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvaluationComponent } from './evaluation.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../services/api.service';
import { of } from 'rxjs';

describe('EvaluationComponent', () => {
  let component: EvaluationComponent;
  let fixture: ComponentFixture<EvaluationComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockReport = {
    evaluatedAt: new Date().toISOString(),
    totalQueries: 120,
    totalPairs: 3600,
    datasetFrozen: true,
    isSampleData: false,
    overall: {
      ai: { precisionAt5: 0.84, ndcgAt5: 0.88, p50LatencyMs: 1.8, p95LatencyMs: 3.5 },
      keyword: { precisionAt5: 0.62, ndcgAt5: 0.67, p50LatencyMs: 1.2, p95LatencyMs: 2.1 },
      relativeGainPercent: 24.7
    },
    byPillar: {}
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['getEvaluationReport']);
    apiServiceSpy.getEvaluationReport.and.returnValue(of(mockReport as any));

    await TestBed.configureTestingModule({
      imports: [EvaluationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create EvaluationComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load research evaluation report with 120 queries', () => {
    expect(component.report).toBeTruthy();
    expect(component.report?.totalQueries).toBe(120);
    expect(component.report?.totalPairs).toBe(3600);
    expect(component.report?.overall.ai.precisionAt5).toBe(0.84);
  });
});
