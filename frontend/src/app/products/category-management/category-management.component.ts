import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../shared/services/product.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  categories: any[] = [];
  newCategoryName = '';
  newCategoryDescription = '';
  newCategoryParentId = '';
  isLoading = false;

  error = '';
  success = '';
  isEditing = false;
  editCategoryId = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.productService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.error = 'Failed to load categories.';
        this.isLoading = false;
      }
    });
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) return;

    this.isLoading = true;
    this.error = '';
    this.success = '';

    const categoryData = {
      name: this.newCategoryName,
      description: this.newCategoryDescription,
      parentId: this.newCategoryParentId || null
    };


    if (this.isEditing) {
      this.productService.updateCategory(this.editCategoryId, categoryData).subscribe({
        next: (res) => {
          this.success = 'Category updated successfully!';
          this.resetForm();
          this.loadCategories();
          this.isLoading = false;
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          console.error('Error updating category:', err);
          this.error = err.error?.message || 'Failed to update category.';
          this.isLoading = false;
        }
      });
    } else {
      this.productService.createCategory(categoryData).subscribe({
        next: (res) => {
          this.success = 'Category added successfully!';
          this.resetForm();
          this.loadCategories();
          this.isLoading = false;
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          console.error('Error adding category:', err);
          this.error = err.error?.message || 'Failed to add category.';
          this.isLoading = false;
        }
      });
    }
  }

  editCategory(cat: any): void {   
    this.isEditing = true;
    this.editCategoryId = cat._id;
    this.newCategoryName = cat.name;
    this.newCategoryDescription = cat.description;
    this.newCategoryParentId = cat.parentId || '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.isEditing = false;
    this.editCategoryId = '';
    this.newCategoryName = '';
    this.newCategoryDescription = '';
    this.newCategoryParentId = '';
    this.error = '';
  }

  getCategoryName(id: string): string {
    const cat = this.categories.find(c => c._id === id);
    return cat ? cat.name : 'N/A';
  }


  deleteCategory(id: string): void {
    if (!confirm('Are you sure you want to delete this category?')) return;

    this.isLoading = true;
    this.productService.deleteCategory(id).subscribe({
      next: () => {
        this.success = 'Category deleted successfully!';
        this.loadCategories();
        this.isLoading = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        this.error = 'Failed to delete category.';
        this.isLoading = false;
      }
    });
  }
}
