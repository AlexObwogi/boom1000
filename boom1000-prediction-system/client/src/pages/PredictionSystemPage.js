// client/src/pages/PredictionSystemPage.js
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Navbar from '../components/Navbar'; // Import Navbar
import { useAuth } from '../context/AuthContext'; // Auth Context
import { getTicks, addTick, deleteAllTicks } from '../api/ticks'; // Tick API
import { getHistory, addHistoryRecord, deleteAllHistory } from '../api/history'; // History API
import socket from '../api/socket'; // Socket.IO client

// The initial historical data is now just a starting point IF the user has no data on the backend.
// Once they add data or we fetch from DB, this initial data is superseded.
// This data will be shown if a user logs in for the first time with no saved ticks.
const INITIAL_HISTORICAL_DATA = [13, 56, 4, 21, 8, 13, 83, 3, 21, 15, 39, 1, 3, 5, 6, 19, 11, 114, 11, 3, 19, 10, 47, 4, 7, 8, 24, 9, 14, 21, 43, 37, 11, 31, 20, 18, 3, 18, 0, 7, 17, 2, 0, 3, 17, 13, 23, 8, 16, 25, 76, 11, 66, 51, 1, 32, 1, 7, 5, 17, 41, 26, 28, 6, 10, 1, 49, 9, 21, 1, 71, 3, 21, 22, 7, 10, 22, 20, 5, 1, 47, 26, 10, 21, 23, 1, 52, 8, 30, 24, 4, 19, 49, 8, 5, 8, 4, 3, 29, 17];

const PredictionSystemPage = () => {
  const { token } = useAuth(); // Get token from AuthContext for API calls
  const [currentData, setCurrentData] = useState([]); // All active data, loaded from DB or real-time
  const [predictionHistory, setPredictionHistory] = useState([]); // Loaded from DB
  const [newTickInput, setNewTickInput] = useState(''); // User input for manual tick
  const [patternLength, setPatternLength] = useState(3);
  const [activeTab, setActiveTab] = useState('input');
  const [confidence, setConfidence] = useState(50);
  const [isLoadingData, setIsLoadingData] = useState(true); // Loading state for initial data fetch
  const [realtimeTick, setRealtimeTick] = useState(null); // State to hold the latest real-time tick

  // useRef to track the length of the data that was initially loaded from the DB/hardcoded.
  // This helps visualize which data points are "new" (user-added) on the chart.
  const initialDataLoadedLengthRef = useRef(0);

  // --- Data Loading from Backend ---
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return; // Don't fetch if not authenticated

      setIsLoadingData(true);
      try {
        const dbTicks = await getTicks(token); // Fetch ticks from the database
        const dbHistory = await getHistory(token); // Fetch prediction history from the database

        // If user has existing ticks in DB, use them. Otherwise, use initial historical data.
        if (dbTicks.length > 0) {
          const tickValues = dbTicks.map(t => t.value);
          setCurrentData(tickValues);
          initialDataLoadedLengthRef.current = tickValues.length; // Set initial length based on DB data
        } else {
          // If no data in DB, use the hardcoded initial data as a starting point.
          // This allows new users to have some data to work with immediately.
          setCurrentData(INITIAL_HISTORICAL_DATA);
          initialDataLoadedLengthRef.current = INITIAL_HISTORICAL_DATA.length;
        }
        
        setPredictionHistory(dbHistory); // Set prediction history from DB
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
        // Optionally, clear token if it's an auth error (e.g., token expired)
        // setAuthToken(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData(); // Call fetch function on component mount or token change
  }, [token]); // Dependency on token ensures data reloads if token changes (e.g., after login)

  // --- Real-time Tick Handling (Socket.IO) ---
  useEffect(() => {
    // Listener for new ticks from the server
    socket.on('newTick', (tick) => {
        setRealtimeTick(tick); // Update state with the new real-time tick
        console.log('Received real-time tick:', tick);
    });

    // Listener for initial ticks on connection (useful for new connections to catch up)
    socket.on('initialTicks', (ticks) => {
        // This is optional: you might append initial ticks to currentData
        // or just use them to update predictions if you don't want to save them.
        // For this demo, let's just log them. The `newTick` event is more frequent.
        console.log('Received initial ticks from socket:', ticks);
    });

    // Cleanup function: disconnect socket listeners when component unmounts
    return () => {
        socket.off('newTick');
        socket.off('initialTicks');
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Function to apply the real-time tick to currentData
  const applyRealtimeTick = async () => {
      if (realtimeTick !== null) {
          await handleAddNewTick(realtimeTick, false); // Add the real-time tick, don't clear input
          setRealtimeTick(null); // Clear the displayed real-time tick
      }
  };

  // --- Core Prediction Logic (mostly unchanged, now uses `currentData`) ---
  const findPatterns = useCallback((data, length) => {
    const patterns = new Map();
    for (let i = 0; i <= data.length - length - 1; i++) {
      const pattern = data.slice(i, i + length);
      const nextValue = data[i + length];
      const key = pattern.join(',');
      if (!patterns.has(key)) {
        patterns.set(key, { 
          pattern, 
          occurrences: [], 
          nextValues: [],
          avgNext: 0,
          confidence: 0
        });
      }
      const patternData = patterns.get(key);
      patternData.occurrences.push(i);
      patternData.nextValues.push(nextValue);
    }
    patterns.forEach((patternData, key) => {
      if (patternData.nextValues.length > 0) {
        patternData.avgNext = patternData.nextValues.reduce((a, b) => a + b, 0) / patternData.nextValues.length;
        const variance = patternData.nextValues.reduce((sum, val) => sum + Math.pow(val - patternData.avgNext, 2), 0) / patternData.nextValues.length;
        const stdDev = Math.sqrt(variance);
        patternData.confidence = Math.max(0, 100 - (stdDev / (patternData.avgNext === 0 ? 1 : patternData.avgNext) * 100));
      }
    });
    return patterns;
  }, []);

  const prediction = useMemo(() => {
    if (currentData.length < patternLength) return null;
    const patterns = findPatterns(currentData, patternLength);
    const currentPattern = currentData.slice(-patternLength).join(',');
    if (patterns.has(currentPattern)) {
      const patternData = patterns.get(currentPattern);
      return {
        pattern: patternData.pattern,
        prediction: Math.round(patternData.avgNext),
        confidence: Math.round(patternData.confidence),
        occurrences: patternData.occurrences.length,
        nextValues: patternData.nextValues,
        range: {
          min: Math.min(...patternData.nextValues),
          max: Math.max(...patternData.nextValues),
          mostCommon: patternData.nextValues.sort((a,b) => 
            patternData.nextValues.filter(v => v === a).length - patternData.nextValues.filter(v => v === b).length
          ).pop()
        }
      };
    }
    return null;
  }, [currentData, patternLength, findPatterns]);

  const bettingRanges = useMemo(() => {
    const ranges = [
      { name: 'Very Low (0-5)', min: 0, max: 5, count: 0 },
      { name: 'Low (6-15)', min: 6, max: 15, count: 0 },
      { name: 'Medium (16-30)', min: 16, max: 30, count: 0 },
      { name: 'High (31-50)', min: 31, max: 50, count: 0 },
      { name: 'Very High (51+)', min: 51, max: Infinity, count: 0 }
    ];
    currentData.forEach(tick => {
      ranges.forEach(range => {
        if (tick >= range.min && tick <= range.max) {
          range.count++;
        }
      });
    });
    const total = currentData.length;
    ranges.forEach(range => {
      range.probability = total > 0 ? ((range.count / total) * 100).toFixed(1) : 0;
      range.recommended = parseFloat(range.probability) >= confidence;
    });
    return ranges.sort((a, b) => b.probability - a.probability);
  }, [currentData, confidence]);

  const predictedBettingRanges = useMemo(() => {
    if (!prediction || prediction.confidence < confidence) return [];
    const p = prediction.prediction;
    const ranges = [
      { name: 'Exact Match', min: p, max: p, probability: 0, count: 0 },
      { name: 'Close (±1)', min: Math.max(0, p - 1), max: p + 1, probability: 0, count: 0 },
      { name: 'Near (±3)', min: Math.max(0, p - 3), max: p + 3, probability: 0, count: 0 },
      { name: 'Extended (±5)', min: Math.max(0, p - 5), max: p + 5, probability: 0, count: 0 },
    ];
    prediction.nextValues.forEach(val => {
        ranges.forEach(range => {
            if (val >= range.min && val <= range.max) {
                range.count++;
            }
        });
    });
    const totalOccurrences = prediction.nextValues.length;
    ranges.forEach(range => {
        range.probability = totalOccurrences > 0 ? ((range.count / totalOccurrences) * 100).toFixed(1) : 0;
        range.recommended = parseFloat(range.probability) >= confidence;
    });
    return ranges.sort((a,b) => b.probability - a.probability);
  }, [prediction, confidence]);

  // --- Backend Interaction Functions ---

  // Unified function to handle adding a new tick (manual or real-time)
  const handleAddNewTick = async (tickValue, clearInput = true) => {
    const tick = parseInt(tickValue);
    if (!isNaN(tick) && tick >= 0) {
      // 1. Record prediction history BEFORE adding the new tick to `currentData`
      // This ensures the prediction history is based on the state *before* the new tick is added
      if (prediction && currentData.length >= patternLength && prediction.confidence >= confidence) {
        const lastPredictedValue = prediction.prediction;
        const actualValueForHistory = tick; 
        const isCorrect = actualValueForHistory === lastPredictedValue;
        const currentPatternValues = currentData.slice(-patternLength);

        let fellIntoRange = 'None';
        for (const range of predictedBettingRanges) {
            if (actualValueForHistory >= range.min && actualValueForHistory <= range.max) {
                fellIntoRange = range.name;
                break;
            }
        }
        
        try {
            // Save prediction history record to backend
            const newRecord = {
                predictedValue: lastPredictedValue,
                actualValue: actualValueForHistory,
                isCorrect: isCorrect,
                pattern: currentPatternValues.join(','),
                confidence: prediction.confidence,
                predictedRange: fellIntoRange,
            };
            const savedRecord = await addHistoryRecord(newRecord, token);
            setPredictionHistory(prevHistory => [savedRecord, ...prevHistory]); // Add to frontend state
        } catch (err) {
            console.error('Failed to save prediction history:', err);
            // Optionally, still add to client-side history for current session if saving failed
            setPredictionHistory(prevHistory => [{ ...newRecord, timestamp: new Date().toISOString() }, ...prevHistory]);
        }
      }
      
      // 2. Add the new tick to the backend
      try {
          const savedTick = await addTick(tick, token);
          setCurrentData(prevData => [...prevData, savedTick.value]); // Update frontend state with saved tick value
          if (clearInput) setNewTickInput(''); // Clear input only if it's a manual entry
      } catch (err) {
          console.error('Failed to save tick:', err);
          // Fallback: Add to client-side state temporarily if saving failed (user might retry)
          setCurrentData(prevData => [...prevData, tick]);
          if (clearInput) setNewTickInput('');
      }
    }
  };

  // Function to delete all data from backend and frontend
  const handleResetAllData = async () => {
    if (!window.confirm("Are you sure you want to delete ALL your tick data and prediction history? This action cannot be undone.")) {
        return; // User cancelled
    }
    try {
        await deleteAllTicks(token); // Delete ticks from backend
        await deleteAllHistory(token); // Delete history from backend
        setCurrentData([]); // Clear frontend tick data
        setPredictionHistory([]); // Clear frontend history
        initialDataLoadedLengthRef.current = 0; // Reset the "original" length reference
    } catch (err) {
        console.error('Failed to delete all data:', err);
        alert('Failed to delete all data. Please try again.');
    }
  };
  
  // --- Chart Data Formatting ---
  const chartData = currentData.map((value, index) => ({
    index: index + 1,
    value,
    isNew: index >= initialDataLoadedLengthRef.current // 'isNew' if index is beyond initial loaded data
  }));

  const totalPredictions = predictionHistory.length;
  const correctPredictions = predictionHistory.filter(p => p.isCorrect).length;
  const successRate = totalPredictions > 0 ? ((correctPredictions / totalPredictions) * 100).toFixed(1) : 0;
  const failRate = totalPredictions > 0 ? (((totalPredictions - correctPredictions) / totalPredictions) * 100).toFixed(1) : 0;

  // Render loading state if data is being fetched
  if (isLoadingData) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
              <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-xl">Loading your data...</p>
          </div>
      );
  }

  return (
    <>
      <Navbar /> {/* Render Navbar */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Boom 1000 Pattern Recognition System
            </h1>
            <p className="text-slate-300">Advanced Pattern Matching & Prediction Engine</p>
            <div className="mt-4 text-sm text-yellow-400 bg-yellow-900 bg-opacity-20 rounded-lg p-3 border border-yellow-700">
              ⚠️ <strong>Disclaimer:</strong> This system identifies historical patterns but cannot guarantee future predictions. Synthetic indices are designed to be random.
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800 rounded-lg p-1 flex space-x-1">
              {['input', 'patterns', 'prediction', 'ranges', 'history'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-md transition-all capitalize font-medium ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {tab === 'input' ? 'Data Input' : tab === 'patterns' ? 'Pattern Analysis' : tab === 'prediction' ? 'Live Prediction' : tab === 'ranges' ? 'Historical Ranges' : 'Prediction History'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'input' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Add New Tick Data</h2>
                <div className="space-y-4">
                  {/* Manual Tick Input */}
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={newTickInput}
                      onChange={(e) => setNewTickInput(e.target.value)}
                      placeholder="Enter tick count"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                      min="0"
                    />
                    <button
                      onClick={() => handleAddNewTick(newTickInput)}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Add Manual Tick
                    </button>
                  </div>
                  
                  {/* Real-time Tick Display and Add Button */}
                  {realtimeTick !== null && (
                      <div className="bg-purple-900 bg-opacity-30 border border-purple-600 rounded-lg p-4 flex items-center justify-between text-yellow-300">
                          <span className="font-semibold">New Real-time Tick: <span className="text-2xl font-bold">{realtimeTick}</span></span>
                          <button
                              onClick={applyRealtimeTick}
                              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                              Add to Data
                          </button>
                      </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Total Data Points: <span className="font-bold text-blue-400">{currentData.length}</span></span>
                    <button
                      onClick={handleResetAllData}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Reset All Data
                    </button>
                  </div>

                  {currentData.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h3 className="font-medium mb-2 text-green-400">Current Data ({currentData.length}):</h3>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {currentData.map((tick, index) => (
                          <span key={index} className={`px-2 py-1 rounded text-sm ${
                              index >= initialDataLoadedLengthRef.current 
                                  ? 'bg-green-900 bg-opacity-50 text-green-300'
                                  : 'bg-blue-900 bg-opacity-50 text-blue-300'
                          }`}>
                            {tick}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-purple-400">System Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Pattern Length</label>
                    <select
                      value={patternLength}
                      onChange={(e) => setPatternLength(parseInt(e.target.value))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value={2}>2 intervals</option>
                      <option value={3}>3 intervals</option>
                      <option value={4}>4 intervals</option>
                      <option value={5}>5 intervals</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Number of previous intervals to match</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Confidence % for Recommendation</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={confidence}
                      onChange={(e) => setConfidence(parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-700 accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>0%</span>
                      <span className="font-bold text-purple-400">{confidence}%</span>
                      <span>100%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Predictions/Ranges below this confidence will not be highlighted as recommended.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-8">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Data Timeline</h2>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="index" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={(props) => (
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={3} 
                          fill={props.payload.isNew ? '#10B981' : '#3B82F6'}
                          stroke={props.payload.isNew ? '#10B981' : '#3B82F6'}
                          strokeWidth={2}
                        />
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center space-x-4 mt-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Initial/Database Data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>User Added Data</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-4 text-purple-400">Pattern Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-400">{findPatterns(currentData, patternLength).size}</div>
                    <div className="text-sm text-slate-300">Unique Patterns Found</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">{currentData.length}</div>
                    <div className="text-sm text-slate-300">Total Data Points</div>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-400">{patternLength}</div>
                    <div className="text-sm text-slate-300">Pattern Length</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prediction' && (
            <div className="space-y-8">
              {prediction && prediction.confidence >= confidence ? (
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-8 border border-blue-500 shadow-2xl">
                  <h2 className="text-2xl font-bold mb-6 text-center text-blue-300">🎯 Live Prediction</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold mb-4 text-purple-300">Current Pattern Match</h3>
                      <div className="bg-slate-800 rounded-lg p-4 mb-4">
                        <div className="text-sm text-slate-400 mb-2">Last {patternLength} intervals:</div>
                        <div className="flex space-x-2">
                          {currentData.slice(-patternLength).map((val, idx) => (
                            <div key={idx} className="bg-blue-600 text-white px-3 py-2 rounded font-bold">
                              {val}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Pattern seen before:</span>
                          <span className="font-bold text-green-400">{prediction.occurrences} times</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Confidence Level:</span>
                          <span className={`font-bold ${prediction.confidence > 70 ? 'text-green-400' : prediction.confidence > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {prediction.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold mb-4 text-purple-300">Prediction Results</h3>
                      <div className="bg-slate-800 rounded-lg p-6 text-center">
                        <div className="text-sm text-slate-400 mb-2">Predicted Next Tick Count (Average)</div>
                        <div className="text-4xl font-bold text-yellow-400 mb-4">{prediction.prediction}</div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-slate-400">Min Seen</div>
                            <div className="font-bold text-red-400">{prediction.range.min}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Most Common</div>
                            <div className="font-bold text-blue-400">{prediction.range.mostCommon}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Max Seen</div>
                            <div className="font-bold text-green-400">{prediction.range.max}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg">
                        <div className="text-sm text-yellow-200">
                          <strong>Historical outcomes for this pattern:</strong>
                          <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                            {prediction.nextValues.map((val, idx) => (
                              <span key={idx} className="bg-yellow-800 bg-opacity-50 px-2 py-1 rounded text-xs">
                                {val}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                          <h3 className="text-lg font-bold mb-3 text-cyan-300">Suggested Betting Ranges (for this prediction)</h3>
                          <div className="space-y-2">
                              {predictedBettingRanges.map((range, index) => (
                                  <div key={index} className={`p-3 rounded-lg border ${range.recommended ? 'border-green-500 bg-green-900 bg-opacity-20' : 'border-slate-600 bg-slate-700'}`}>
                                      <div className="flex justify-between items-center text-sm">
                                          <span className="font-semibold">{range.name} ({range.min}-{range.max === Infinity ? '∞' : range.max})</span>
                                          <span className={`font-bold ${range.recommended ? 'text-green-400' : 'text-slate-300'}`}>{range.probability}%</span>
                                      </div>
                                      {range.recommended && <p className="text-xs text-green-300 mt-1">Recommended based on confidence.</p>}
                                  </div>
                              ))}
                              {predictedBettingRanges.length === 0 && (
                                <p className="text-sm text-slate-400">No ranges recommended at current confidence ({confidence}%).</p>
                              )}
                          </div>
                      </div>

                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-xl font-bold mb-2 text-slate-300">
                    {prediction ? 'Prediction Confidence Too Low' : 'No Pattern Match Found'}
                  </h2>
                  <p className="text-slate-400">
                    {prediction
                      ? `The current pattern has a confidence of ${prediction.confidence}%, which is below your minimum set of ${confidence}%.`
                      : `The current sequence of ${patternLength} intervals hasn't been seen before in the dataset.`}
                    This suggests either:
                  </p>
                  <ul className="text-sm text-slate-400 mt-4 space-y-1">
                    <li>• The pattern is truly unique (high randomness)</li>
                    <li>• You need more data points</li>
                    <li>• Try adjusting the pattern length or minimum confidence</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ranges' && (
            <div className="space-y-8">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                <h2 className="text-xl font-bold mb-6 text-green-400">📊 Historical Betting Range Probabilities</h2>
                <p className="text-slate-300 mb-6">Based on the entire dataset, here are the historical probabilities of tick counts falling into specific ranges.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bettingRanges}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          formatter={(value, name, props) => [`${value}%`, 'Probability']}
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="probability" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    {bettingRanges.map((range, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border-2 ${
                          range.recommended 
                            ? 'bg-green-900 bg-opacity-30 border-green-500' 
                            : 'bg-slate-700 border-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-white">{range.name}</h3>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                            range.recommended ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
                          }`}>
                            {range.probability}%
                          </div>
                        </div>
                        <div className="text-sm text-slate-300">
                          Range: {range.min}-{range.max === Infinity ? '∞' : range.max} ticks
                        </div>
                        <div className="text-sm text-slate-300">
                          Occurrences: {range.count}/{currentData.length}
                        </div>
                        {range.recommended && (
                          <div className="mt-2 text-xs text-green-400 font-medium">
                            ✓ High probability range - consider for betting
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-6">
                  <h3 className="font-bold text-red-400 mb-3">⚠️ Important Risk Warnings</h3>
                  <div className="text-sm text-red-200 space-y-2">
                    <p><strong>Pattern Recognition Limitations:</strong> Even with perfect historical pattern matching, synthetic indices are designed to be unpredictable.</p>
                    <p><strong>Small Sample Bias:</strong> {currentData.length} data points may not represent long-term behavior.</p>
                    <p><strong>No Guarantee:</strong> Past patterns do not guarantee future results in random systems.</p>
                    <p><strong>House Edge:</strong> Trading platforms typically have built-in advantages that make consistent profit difficult.</p>
                    <p><strong>Risk Management:</strong> Never bet more than you can afford to lose, regardless of confidence levels.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
                  <h2 className="text-xl font-bold mb-4 text-yellow-400">📈 Prediction History & Performance</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-slate-700 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-400">{totalPredictions}</div>
                          <div className="text-sm text-slate-300">Total Predictions</div>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-400">{successRate}%</div>
                          <div className="text-sm text-slate-300">Success Rate</div>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-red-400">{failRate}%</div>
                          <div className="text-sm text-slate-300">Fail Rate</div>
                      </div>
                  </div>

                  {predictionHistory.length === 0 ? (
                      <div className="text-center text-slate-400 p-8">
                          No prediction history yet. Add new ticks to see performance.
                      </div>
                  ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left table-auto">
                              <thead>
                                  <tr className="bg-slate-700">
                                      <th className="px-4 py-2 text-slate-300 text-sm">Timestamp</th>
                                      <th className="px-4 py-2 text-slate-300 text-sm">Pattern</th>
                                      <th className="px-4 py-2 text-slate-300 text-sm">Pred. Value</th>
                                      <th className="px-4 py-2 text-slate-300 text-sm">Actual Value</th>
                                      <th className="px-4 py-2 text-slate-300 text-sm">Confidence</th>
                                      <th className="px-4 py-2 text-slate-300 text-sm">Result</th>
                                      <th className="px-4 py-2 text-slate-300 text-sm">Predicted Range</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {predictionHistory.map((p, index) => ( // History is fetched sorted descending, so no reverse needed here
                                      <tr key={p._id || index} className={index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-700'}>
                                          <td className="px-4 py-2 text-sm text-slate-300">{new Date(p.timestamp).toLocaleString()}</td>
                                          <td className="px-4 py-2 text-sm text-slate-300">{p.pattern}</td>
                                          <td className="px-4 py-2 text-sm font-bold text-yellow-400">{p.predictedValue}</td>
                                          <td className="px-4 py-2 text-sm font-bold">{p.actualValue}</td>
                                          <td className="px-4 py-2 text-sm">{p.confidence}%</td>
                                          <td className={`px-4 py-2 text-sm font-bold ${p.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                              {p.isCorrect ? 'Correct' : 'Incorrect'}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-cyan-300">{p.predictedRange}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PredictionSystemPage;
