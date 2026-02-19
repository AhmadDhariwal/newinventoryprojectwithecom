import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedpurchaseamountComponent } from './approvedpurchaseamount.component';

describe('ApprovedpurchaseamountComponent', () => {
  let component: ApprovedpurchaseamountComponent;
  let fixture: ComponentFixture<ApprovedpurchaseamountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovedpurchaseamountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovedpurchaseamountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
