import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingpurchaseamountComponent } from './pendingpurchaseamount.component';

describe('PendingpurchaseamountComponent', () => {
  let component: PendingpurchaseamountComponent;
  let fixture: ComponentFixture<PendingpurchaseamountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingpurchaseamountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingpurchaseamountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
