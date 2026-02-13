import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../shared/services/product.service';
import { Product } from '../../shared/models/inventory/product.model';
import { ConfirmModalComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmModalComponent],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: any[] = [];
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  productId: string | null = null;
  originalFormValue: any = null;
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  private isSyncing = false;


  showUpdateModal = false;
  showNoChangesModal = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      sku: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: ['', Validators.required],
      cost: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [null, [Validators.min(0)]],
      discountPercentage: [null, [Validators.min(0), Validators.max(100)]],
      status: ['active', Validators.required]
    });
    this.setupDiscountSync();
  }


  ngOnInit(): void {
    this.loadCategories();
    this.checkEditMode();
  }

  checkEditMode(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
  }

  loadProduct(): void {
    if (!this.productId) return;
    
    this.isLoading = true;
    this.productService.getProductById(this.productId).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          sku: product.sku,
          description: product.description,
          category: product.category?._id,
          cost: product.cost,
          price: product.price,
          discountPrice: product.discountPrice,
          discountPercentage: product.discountPercentage,
          status: product.status || 'active'

        });
        this.existingImages = product.images || [];
        this.originalFormValue = this.productForm.value;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      if (this.isEditMode && this.hasFormChanged()) {
        this.showUpdateModal = true;
      } else if (this.isEditMode && !this.hasFormChanged()) {
        this.showNoChangesModal = true;
      } else {
        this.saveProduct();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  hasFormChanged(): boolean {
    return JSON.stringify(this.originalFormValue) !== JSON.stringify(this.productForm.value);
  }

  saveProduct(): void {
    this.isSubmitting = true;
    const formData = new FormData();
    
    Object.keys(this.productForm.value).forEach(key => {
      formData.append(key, this.productForm.value[key]);
    });

    this.selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    if (this.isEditMode && this.existingImages.length > 0) {
      formData.append('existingImages', JSON.stringify(this.existingImages));
    }

    const operation = this.isEditMode 
      ? this.productService.updateProduct(this.productId!, formData)
      : this.productService.createProduct(formData);

    operation.subscribe({
      next: () => {
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Error saving product:', err);
        this.isSubmitting = false;
      }
    });
  }

  confirmUpdate(): void {
    this.showUpdateModal = false;
    this.saveProduct();
  }

  cancelUpdate(): void {
    this.showUpdateModal = false;
  }

  confirmNoChanges(): void {
    this.showNoChangesModal = false;
    this.router.navigate(['/products']);
  }

  cancelNoChanges(): void {
    this.showNoChangesModal = false;
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['min']) return `${fieldName} must be greater than or equal to ${field.errors['min'].min}`;
    }
    return '';
  }

  trackByCategory(index: number, category: any): string {
    return category._id;
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.existingImages.splice(index, 1);
  }

  private setupDiscountSync(): void {
    const priceCtrl = this.productForm.get('price');
    const discountPriceCtrl = this.productForm.get('discountPrice');
    const discountPercentCtrl = this.productForm.get('discountPercentage');

    discountPriceCtrl?.valueChanges.subscribe(val => {
      if (val !== null && priceCtrl?.value && !this.isSyncing) {
        this.isSyncing = true;
        const percentage = Math.round((1 - (val / priceCtrl.value)) * 100);
        discountPercentCtrl?.setValue(percentage, { emitEvent: false });
        this.isSyncing = false;
      }
    });

    discountPercentCtrl?.valueChanges.subscribe(val => {
      if (val !== null && priceCtrl?.value && !this.isSyncing) {
        this.isSyncing = true;
        const price = Math.round((priceCtrl.value * (1 - (val / 100))) * 100) / 100;
        discountPriceCtrl?.setValue(price, { emitEvent: false });
        this.isSyncing = false;
      }
    });
  }
}

