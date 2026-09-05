'use client'

import React, { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'

interface ChartPoint {
  time: number // unix timestamp in seconds
  value: number
  volume?: number
}

interface PulseChartProps {
  data: ChartPoint[]
  referencePrice?: number
  symbol: string
  color?: string
}

export function PulseChart({ data, referencePrice, symbol, color = '#00d09c' }: PulseChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: '#64748b', width: 1, style: 2 },
        horzLine: { color: '#64748b', width: 1, style: 2 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      height: 320,
    })

    chartRef.current = chart

    const areaSeries = chart.addAreaSeries({
      lineColor: color,
      topColor: `${color}33`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    })

    seriesRef.current = areaSeries

    // Sort unique timestamps
    const uniqueSortedData = data
      .filter((v, i, a) => a.findIndex(t => t.time === v.time) === i)
      .sort((a, b) => a.time - b.time)
      .map(d => ({
        time: d.time as any,
        value: d.value,
      }))

    areaSeries.setData(uniqueSortedData)

    // Add reference price baseline line if provided
    if (referencePrice && referencePrice > 0) {
      areaSeries.createPriceLine({
        price: referencePrice,
        color: '#64748b',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: 'Last Seen Ref',
      })
    }

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, referencePrice, symbol, color])

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center rounded-xl bg-surface-900/50 border border-slate-800 text-slate-500 text-xs">
        No historical chart observations recorded for this interval.
      </div>
    )
  }

  return <div ref={chartContainerRef} className="w-full h-80 rounded-xl overflow-hidden" />
}
