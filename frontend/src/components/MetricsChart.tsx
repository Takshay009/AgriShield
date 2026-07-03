"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function MetricsChart({ metrics }: { metrics: any[] }) {
  if (!metrics || metrics.length === 0) {
    return <div className="text-gray-500 text-sm py-4">No metrics available.</div>;
  }

  const labels = metrics.map(m => new Date(m.captured_at).toLocaleDateString());
  const ndviData = metrics.map(m => parseFloat(m.ndvi_avg));
  const riskData = metrics.map(m => parseFloat(m.risk_probability) * 100);

  const data = {
    labels,
    datasets: [
      {
        label: 'NDVI (0-1)',
        data: ndviData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        yAxisID: 'y',
      },
      {
        label: 'Risk Probability (%)',
        data: riskData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'NDVI' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Risk %' }
      },
    },
  };

  return <Line options={options} data={data} />;
}
