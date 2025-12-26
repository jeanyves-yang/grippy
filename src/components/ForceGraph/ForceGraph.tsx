import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { WeightMeasurement } from '../../lib/tindeq-protocol'
import './ForceGraph.scss'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ForceGraphProps {
  measurements: WeightMeasurement[]
  peakWeight?: number
}

export function ForceGraph({ measurements, peakWeight }: ForceGraphProps) {
  const chartRef = useRef<ChartJS<'line'>>(null)

  // Update chart on new data
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update('none') // Update without animation for real-time
    }
  }, [measurements])

  // Prepare data for Chart.js (empty or with measurements)
  const data = {
    labels: measurements.map((_, i) => i.toString()),
    datasets: [
      {
        label: 'Force (kg)',
        data: measurements.map(m => m.weight),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false, // Disable for real-time performance
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `${context.parsed.y?.toFixed(2) ?? 0} kg`,
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false, // Hide x-axis for cleaner look
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value) => `${value} kg`,
        },
      },
    },
  }

  return (
    <div className="force-graph">
      <div className="force-graph-container">
        {measurements.length === 0 ? (
          <div className="force-graph-empty">
            <p>No data yet. Start a measurement to see the force curve.</p>
          </div>
        ) : (
          <Line ref={chartRef} data={data} options={options} />
        )}
      </div>
      {peakWeight !== undefined && peakWeight > 0 && (
        <div className="force-graph-peak">
          Peak: <strong>{peakWeight.toFixed(1)} kg</strong>
        </div>
      )}
    </div>
  )
}
