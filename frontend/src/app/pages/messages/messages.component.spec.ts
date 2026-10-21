import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessagesComponent } from './messages.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';

describe('MessagesComponent', () => {
  let component: MessagesComponent;
  let fixture: ComponentFixture<MessagesComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockThread = {
    id: 'thread-1',
    otherUserId: 'user-2',
    otherUserName: 'Dawit Tadesse',
    otherUserEmail: 'dawit@ethiobridge.et',
    subject: 'Project Inquiry',
    lastMessageContent: 'Hello Sara',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0
  };

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getMessageThreads',
      'getThreadMessages',
      'sendMessageToThread',
      'createOrGetThread'
    ]);
    apiServiceSpy.getMessageThreads.and.returnValue(of([mockThread as any]));
    apiServiceSpy.getThreadMessages.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MessagesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        },
        { provide: ApiService, useValue: apiServiceSpy },
        {
          provide: AuthService,
          useValue: {
            userSnapshot: { userId: 'user-1', email: 'sara@ethiobridge.et', fullName: 'Sara Bekele' }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create MessagesComponent', () => {
    expect(component).toBeTruthy();
  });

  it('should load conversation threads on initialization', () => {
    expect(component.threads.length).toBe(1);
    expect(component.threads[0].otherUserName).toBe('Dawit Tadesse');
  });

  it('should clear new message input after send', () => {
    component.activeThread = mockThread as any;
    component.newMessage = 'Test message';
    apiServiceSpy.sendMessageToThread.and.returnValue(of({
      id: 'msg-1',
      threadId: 'thread-1',
      senderUserId: 'user-1',
      content: 'Test message',
      createdAt: new Date().toISOString()
    } as any));

    component.sendMessage();

    expect(apiServiceSpy.sendMessageToThread).toHaveBeenCalledWith('thread-1', 'Test message');
    expect(component.newMessage).toBe('');
  });
});
