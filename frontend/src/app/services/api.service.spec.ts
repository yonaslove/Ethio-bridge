import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { MatchRunResponse } from '../models/models';

describe('ApiService', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;

  function setup(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    api = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('requests candidates from the backend with the session token', () => {
    localStorage.setItem('ethiobridge_token', 'eb-token');
    localStorage.setItem(
      'ethiobridge_user',
      JSON.stringify({ userId: 'u1', roles: ['PROVIDER'], email: 'p@x.et', fullName: 'P', status: 'ACTIVE' })
    );
    setup();

    const listingId = 'c7a1';
    const expected = {
      listingId,
      method: 'AI',
      k: 5,
      model: 'paraphrase-multilingual-MiniLM-L12-v2',
      modelVersion: '1.0.0',
      latencyMs: 12,
      degraded: false,
      results: []
    } as MatchRunResponse;

    let result: MatchRunResponse | undefined;
    api.getCandidates(listingId, 'ai', 5).subscribe(res => (result = res));

    const req = httpMock.expectOne(
      r => r.url === `http://localhost:8080/api/v1/listings/${listingId}/candidates?method=ai&k=5`
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer eb-token');
    req.flush(expected);

    expect(result?.method).toBe('AI');
    expect(result?.degraded).toBeFalse();
  });

  it('reads the evaluation report from the AI service', () => {
    setup();

    api.getEvaluationReport().subscribe();

    const req = httpMock.expectOne(r => r.url === 'http://localhost:8000/ai/v1/evaluation');
    expect(req.request.method).toBe('GET');
    req.flush({ datasetSize: 120, pairs: 3600 });
  });

  it('sends no Authorization header for anonymous requests', () => {
    setup();

    api.getMe().subscribe();

    const req = httpMock.expectOne(r => r.url === 'http://localhost:8080/api/v1/me');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });
});
