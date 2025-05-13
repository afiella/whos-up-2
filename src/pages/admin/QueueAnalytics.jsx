// src/pages/admin/QueueAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { db } from '../../firebase/config';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

export default function QueueAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    totalPlayers: 0,
    avgWaitTime: 0,
    appointmentRatio: 0,
    peakTimeData: [],
    roomStats: {},
    loading: true,
    error: null
  });
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        // Get historical records to analyze
        const historyCollectionRef = collection(db, 'historical_records');
        const q = query(historyCollectionRef, orderBy('date', 'desc'), limit(7)); // Last 7 days
        const querySnapshot = await getDocs(q);
        
        // Process the data
        let totalJoins = 0;
        let totalWaitTime = 0;
        let totalAppointments = 0;
        let totalActions = 0;
        const timeDistribution = Array(24).fill(0); // 24 hours
        const roomActivityCount = {'bh': 0, '59': 0, 'ashland': 0};
        
        querySnapshot.forEach((doc) => {
          const record = doc.data();
          const roomId = record.roomId;
          
          if (roomId && roomActivityCount[roomId] !== undefined) {
            roomActivityCount[roomId]++;
          }
          
          if (record.history && Array.isArray(record.history)) {
            record.history.forEach(entry => {
              totalActions++;
              
              // Count appointments
              if (entry.action === 'wentOnAppointment') {
                totalAppointments++;
              }
              
              // Count queue joins and exits for wait time calculation
              if (entry.action === 'joinedQueue') {
                totalJoins++;
                
                // Try to extract hour for time distribution
                if (entry.timestamp) {
                  let timestamp;
                  if (typeof entry.timestamp === 'string') {
                    timestamp = new Date(entry.timestamp);
                  } else if (entry.timestamp.toDate) {
                    timestamp = entry.timestamp.toDate();
                  }
                  
                  if (timestamp) {
                    const hour = timestamp.getHours();
                    timeDistribution[hour]++;
                  }
                }
              }
            });
          }
        });
        
        // Find peak hours (top 3)
        const peakHours = timeDistribution.map((count, hour) => ({hour, count}))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map(item => ({
            hour: item.hour,
            label: `${item.hour % 12 || 12}${item.hour < 12 ? 'AM' : 'PM'}`,
            count: item.count
          }));
        
        // Calculate room percentages
        const totalRoomActivity = Object.values(roomActivityCount).reduce((sum, val) => sum + val, 0);
        const roomPercentages = {};
        Object.keys(roomActivityCount).forEach(room => {
          roomPercentages[room] = totalRoomActivity > 0 
            ? Math.round((roomActivityCount[room] / totalRoomActivity) * 100) 
            : 0;
        });
        
        // Estimate average wait time (simplified)
        const avgWaitTime = totalJoins > 0 ? Math.round((totalActions / totalJoins) * 2.5) : 0;
        
        setAnalyticsData({
          totalPlayers: totalJoins,
          avgWaitTime: avgWaitTime,
          appointmentRatio: totalActions > 0 ? Math.round((totalAppointments / totalActions) * 100) : 0,
          peakTimeData: peakHours,
          roomStats: roomPercentages,
          loading: false,
          error: null
        });
        
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        setAnalyticsData(prev => ({
          ...prev,
          loading: false,
          error: "Failed to load analytics data"
        }));
      }
    };
    
    fetchAnalyticsData();
  }, []);
  
  // Styling
  const container = css`
    background-color: white;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  `;
  
  const title = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1.25rem;
    color: #4b3b2b;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;
  
  const statsGrid = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  `;
  
  const statCard = css`
    background-color: #f6f6f6;
    border-radius: 0.5rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `;
  
  const statValue = css`
    font-size: 2rem;
    font-weight: 700;
    color: #d67b7b;
    margin-bottom: 0.5rem;
  `;
  
  const statLabel = css`
    font-size: 0.875rem;
    color: #6b6b6b;
    text-align: center;
  `;
  
  const sectionTitle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    font-size: 1rem;
    color: #4b3b2b;
    margin: 1.5rem 0 1rem;
  `;
  
  const timeGrid = css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  `;
  
  const timeCard = css`
    background-color: #f6dfdf;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
  `;
  
  const timeValue = css`
    font-size: 1.25rem;
    font-weight: 600;
    color: #d67b7b;
  `;
  
  const roomGrid = css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  `;
  
  const roomCard = css`
    background-color: #f6f6f6;
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
  `;
  
  const roomValue = css`
    font-size: 1.5rem;
    font-weight: 600;
    color: #d67b7b;
  `;
  
  if (analyticsData.loading) {
    return (
      <div className={container}>
        <h2 className={title}>
          <span role="img" aria-label="Analytics">📊</span> Queue Analytics
        </h2>
        <div>Loading analytics data...</div>
      </div>
    );
  }
  
  if (analyticsData.error) {
    return (
      <div className={container}>
        <h2 className={title}>
          <span role="img" aria-label="Analytics">📊</span> Queue Analytics
        </h2>
        <div style={{ color: '#d67b7b' }}>{analyticsData.error}</div>
      </div>
    );
  }
  
  return (
    <div className={container}>
      <h2 className={title}>
        <span role="img" aria-label="Analytics">📊</span> Queue Analytics (Last 7 Days)
      </h2>
      
      <div className={statsGrid}>
        <div className={statCard}>
          <div className={statValue}>{analyticsData.totalPlayers}</div>
          <div className={statLabel}>Total Players</div>
        </div>
        
        <div className={statCard}>
          <div className={statValue}>{analyticsData.avgWaitTime}m</div>
          <div className={statLabel}>Average Wait Time</div>
        </div>
        
        <div className={statCard}>
          <div className={statValue}>{analyticsData.appointmentRatio}%</div>
          <div className={statLabel}>On Appointment Rate</div>
        </div>
      </div>
      
      <h3 className={sectionTitle}>Peak Hours</h3>
      <div className={timeGrid}>
        {analyticsData.peakTimeData.map((peak, index) => (
          <div key={index} className={timeCard}>
            <div className={timeValue}>{peak.label}</div>
            <div className={statLabel}>{peak.count} Players</div>
          </div>
        ))}
      </div>
      
      <h3 className={sectionTitle}>Room Activity</h3>
      <div className={roomGrid}>
        {Object.entries(analyticsData.roomStats).map(([roomId, percentage]) => (
          <div key={roomId} className={roomCard}>
            <div className={roomValue}>{percentage}%</div>
            <div className={statLabel}>
              {roomId === 'bh' ? 'BH Room' : 
               roomId === '59' ? '59 Room' : 'Ashland Room'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}