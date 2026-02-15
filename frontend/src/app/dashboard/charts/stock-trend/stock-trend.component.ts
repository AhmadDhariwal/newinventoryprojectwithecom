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
  selector: 'app-stock-trend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-trend.component.html',
  styleUrls: ['./stock-trend.component.scss']
})
export class StockTrendComponent implements OnChanges, AfterViewInit {

  @Input() trend: any[] = [];
  @ViewChild('chartCanvas', { static: false }) canvas!: ElementRef;

  chart!: Chart;
  private chartInitialized = false;

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
      console.log('Stock trend: Canvas or data not ready');
      return;
    }

    const labels: string[] = [];
    const stockIn: number[] = [];
    const stockOut: number[] = [];
    const netMovement: number[] = [];

    this.trend.forEach(day => {
      const date = day.date || day._id;
      labels.push(new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      const inQty = day.inQty || 0;
      const outQty = day.outQty || 0;
      const net = inQty - outQty;

      stockIn.push(inQty);
      stockOut.push(outQty);
      netMovement.push(net);
    });

    if (this.chart) {
      this.chart.destroy();
    }

    console.log('Rendering stock trend chart with', labels.length, 'data points');

    this.chart = new Chart(this.canvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Stock In',
            data: stockIn,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#2ecc71',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4
          },
          {
            label: 'Stock Out',
            data: stockOut,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#e74c3c',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4
          },
          {
            label: 'Net Movement',
            data: netMovement,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#3498db',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3,
            borderDash: [5, 5]
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
            displayColors: true,
            callbacks: {
              title: (context) => {
                return `Date: ${context[0].label}`;
              },
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y} units`;
              }
            }
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
                return value + ' units';
              }
            }
          }
        }
      }
    });

    this.chartInitialized = true;
  }
}
