import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../shared/services/dashboard.service';
import {
  ChartComponent,
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexLegend,
  ApexFill,
  ApexTitleSubtitle
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  fill: ApexFill;
  title: ApexTitleSubtitle;
  colors: string[];
};

@Component({
  selector: 'app-order-analytics-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './order-analytics-chart.component.html',
  styleUrls: ['./order-analytics-chart.component.scss']
})
export class OrderAnalyticsChartComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | any;
  
  loading = true;
  error = false;
  selectedRange = 7;
  
  ranges = [
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
    { label: '90 Days', value: 90 }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.initChart();
    this.fetchData(7);
  }

  initChart() {
    this.chartOptions = {
      series: [],
      chart: {
        type: "bar",
        height: 350,
        stacked: true,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
              enabled: true,
              delay: 150
          },
          dynamicAnimation: {
              enabled: true,
              speed: 350
          }
        },
        background: 'transparent'
      },
      colors: ["#3498db", "#2ecc71", "#f39c12", "#e74c3c"], // Blue, Green, Orange, Red
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"]
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: "#ffffff",
            fontSize: '12px'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: "Order Count",
          style: {
            color: '#ffffff'
          }
        },
        labels: {
          style: {
            colors: "#ffffff"
          }
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: function(val: any, { series, seriesIndex, dataPointIndex, w }: any) {
            const total = w.globals.stackedSeriesTotals[dataPointIndex];
            const percent = ((val / total) * 100).toFixed(1);
            return `${val} orders (${percent}%)`;
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        labels: {
          colors: '#ffffff'
        }
      },
      grid: {
        borderColor: 'rgba(255,255,255,0.1)',
        strokeDashArray: 4
      }
    };
  }

  fetchData(range: number = this.selectedRange) {
    this.loading = true;
    this.selectedRange = range;
    
    this.dashboardService.getOrderStatusAnalytics(range).subscribe({
      next: (data) => {
        this.processData(data);
        this.loading = false;
        this.error = false;
      },
      error: (err) => {
        console.error('Error fetching order analytics:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  processData(data: any[]) {
    const categories: string[] = [];
    const processing: number[] = [];
    const completed: number[] = [];
    const pending: number[] = [];
    const returned: number[] = [];

    data.forEach(item => {
      categories.push(item.date);
      processing.push(item.processing || 0);
      completed.push(item.completed || 0);
      pending.push(item.pending || 0);
      returned.push(item.returned || 0);
    });

    this.chartOptions.series = [
      { name: "Processing", data: processing },
      { name: "Completed", data: completed },
      { name: "Pending", data: pending },
      { name: "Returned", data: returned }
    ];
    
    this.chartOptions.xaxis = {
      ...this.chartOptions.xaxis,
      categories: categories
    };
  }

  setRange(range: number) {
    this.fetchData(range);
  }
}
