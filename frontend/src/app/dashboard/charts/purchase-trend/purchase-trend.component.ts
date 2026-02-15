import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-purchase-trend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-trend.component.html',
  styleUrls: ['./purchase-trend.component.scss']
})
export class PurchaseTrendComponent implements OnChanges, AfterViewInit {

  @Input() trend: any[] = [];
  @ViewChild('chartCanvas', { static: false }) canvas!: ElementRef;

  chart!: Chart;

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.trend?.length > 0) {
        this.renderChart();
      }
    }, 200);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trend'] && this.trend?.length > 0) {
      setTimeout(() => this.renderChart(), 200);
    }
  }

  renderChart() {
    if (!this.canvas?.nativeElement || !this.trend?.length) {
      console.log('Purchase trend: Canvas or data not ready');
      return;
    }

    const labels: string[] = [];
    const amounts: number[] = [];
    const quantities: number[] = [];

    this.trend.forEach(day => {
      const date = day.date || day._id;
      labels.push(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      amounts.push(day.totalAmount || 0);
      quantities.push(day.totalQuantity || 0);
    });

    if (this.chart) {
      this.chart.destroy();
    }

    console.log('Rendering purchase trend chart with', labels.length, 'data points');

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Purchase Amount ($)',
            data: amounts,
            backgroundColor: 'rgba(52, 152, 219, 0.8)',
            borderColor: '#3498db',
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Purchase Quantity',
            data: quantities,
            type: 'line',
            borderColor: '#e67e22',
            backgroundColor: 'rgba(230, 126, 34, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#e67e22',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                weight: 'normal'
              },
              color: '#636e72'
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            border: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                weight: 'normal'
              },
              color: '#636e72',
              callback: function(value) {
                return '$' + value;
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              font: {
                size: 11,
                weight: 'normal'
              },
              color: '#636e72',
              callback: function(value) {
                return value + ' units';
              }
            }
          }
        }
      }
    });
  }
}