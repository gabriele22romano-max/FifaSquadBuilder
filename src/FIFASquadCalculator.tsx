import React, { useState } from 'react';
import { Calculator, Users, TrendingUp, Plus, Trash2, Play } from 'lucide-react';

const FIFASquadCalculator = () => {
  const [inventory, setInventory] = useState({
    93: { total: 0, unique: 0 },
    92: { total: 0, unique: 0 },
    91: { total: 0, unique: 0 },
    90: { total: 0, unique: 0 },
    89: { total: 5, unique: 3 },
    88: { total: 10, unique: 4 },
    87: { total: 9, unique: 5 },
    86: { total: 18, unique: 8 },
    85: { total: 23, unique: 10 },
    84: { total: 50, unique: 20 },
    83: { total: 100, unique: 40 },
    82: { total: 0, unique: 0 },
    81: { total: 0, unique: 0 },
    80: { total: 0, unique: 0 }
  });

  const [targetSquads, setTargetSquads] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [calculating, setCalculating] = useState(false);

  // Funzione per calcolare il rating FIFA
  const calculateFIFARating = (players) => {
    const total = players.reduce((sum, p) => sum + p.rating * p.count, 0);
    const count = players.reduce((sum, p) => sum + p.count, 0);
    const avg = total / count;
    
    let adjustedTotal = 0;
    players.forEach(p => {
      if (p.rating > avg) {
        const diff = p.rating - avg;
        adjustedTotal += (p.rating + diff) * p.count;
      } else {
        adjustedTotal += p.rating * p.count;
      }
    });
    
    const adjustedAvg = adjustedTotal / count;
    const rounded2Dec = Math.round(adjustedAvg * 100) / 100;
    
    const decimals = rounded2Dec - Math.floor(rounded2Dec);
    const finalRating = decimals >= 0.96 ? Math.ceil(rounded2Dec) : Math.floor(rounded2Dec);
    
    return { adjustedAvg, rounded2Dec, finalRating };
  };

  const calculateDiversityScore = (combo) => {
    const counts = Object.entries(combo);
    // Penalizza l'uso di carte alte: più è alto il rating, più pesa negativamente
    let score = 0;
    for (const [rating, count] of counts) {
      const ratingNum = parseInt(rating);
      // Peso esponenziale: carte alte pesano molto di più
      score += count * count * (ratingNum / 80); // Normalizza intorno a 80
    }
    return score;
  };

  const findCombination = (targetRating, available) => {
    const squadSize = 11;
    const minTarget = targetRating - 1 + 0.96;
    const maxTarget = targetRating + 0.95;
    
    const validCombinations = [];
    const ratings = Object.keys(available).map(Number).sort((a, b) => b - a);
    
    const tryCombo = (index, currentCombo, remaining) => {
      if (remaining === 0) {
        const players = [];
        let total = 0;
        for (const [rating, count] of Object.entries(currentCombo)) {
          if (count > 0) {
            players.push({ rating: parseInt(rating), count });
            total += count;
          }
        }
        
        if (total === squadSize) {
          const { adjustedAvg, finalRating } = calculateFIFARating(players);
          if (finalRating === targetRating && adjustedAvg >= minTarget && adjustedAvg <= maxTarget) {
            validCombinations.push({ ...currentCombo });
          }
        }
        return;
      }
      
      if (index >= ratings.length || remaining < 0) return;
      
      const rating = ratings[index];
      const maxUse = Math.min(available[rating].available, remaining, available[rating].unique);
      
      for (let use = 0; use <= maxUse; use++) {
        currentCombo[rating] = use;
        tryCombo(index + 1, currentCombo, remaining - use);
      }
      currentCombo[rating] = 0;
    };
    
    tryCombo(0, {}, squadSize);
    validCombinations.sort((a, b) => calculateDiversityScore(a) - calculateDiversityScore(b));
    
    return validCombinations.length > 0 ? validCombinations[0] : null;
  };

  const calculateSquads = () => {
    setCalculating(true);
    setTimeout(() => {
      const sortedTargets = [...targetSquads].sort((a, b) => b.rating - a.rating);
      
      const available = {};
      for (const [rating, data] of Object.entries(inventory)) {
        available[rating] = { available: data.total, unique: data.unique };
      }
      
      const result = [];
      let squadNum = 1;
      
      for (const target of sortedTargets) {
        for (let i = 0; i < target.count; i++) {
          const combo = findCombination(target.rating, available);
          
          if (combo) {
            for (const [rating, count] of Object.entries(combo)) {
              if (count > 0) {
                available[rating].available -= count;
              }
            }
            
            const players = [];
            for (const [rating, count] of Object.entries(combo)) {
              if (count > 0) {
                players.push({ rating: parseInt(rating), count });
              }
            }
            players.sort((a, b) => b.rating - a.rating);
            
            const { adjustedAvg, rounded2Dec, finalRating } = calculateFIFARating(players);
            
            result.push({
              squadNum: squadNum++,
              targetRating: target.rating,
              finalRating,
              adjustedAvg,
              rounded2Dec,
              combo,
              players
            });
          } else {
            result.push({
              squadNum: squadNum++,
              targetRating: target.rating,
              failed: true
            });
          }
        }
      }
      
      setSolutions(result);
      setCalculating(false);
    }, 100);
  };

  const updateInventory = (rating, field, value) => {
    setInventory(prev => ({
      ...prev,
      [rating]: {
        ...prev[rating],
        [field]: Math.max(0, parseInt(value) || 0)
      }
    }));
  };

  const addTargetSquad = (rating) => {
    const existing = targetSquads.find(t => t.rating === rating);
    if (existing) {
      setTargetSquads(prev => prev.map(t => 
        t.rating === rating ? { ...t, count: t.count + 1 } : t
      ));
    } else {
      setTargetSquads(prev => [...prev, { rating, count: 1 }]);
    }
  };

  const removeTargetSquad = (rating) => {
    setTargetSquads(prev => {
      const existing = prev.find(t => t.rating === rating);
      if (existing && existing.count > 1) {
        return prev.map(t => t.rating === rating ? { ...t, count: t.count - 1 } : t);
      }
      return prev.filter(t => t.rating !== rating);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold text-white">FIFA Squad Builder Pro</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventario Carte */}
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📦 Inventario Carte</h2>
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 mb-4 text-sm text-blue-100">
                <strong>💡 Come funziona:</strong> Se hai 5 carte 89 (Kane, Kane, Kane, Russo, Shaw), metti <strong>Totali: 5</strong> e <strong>Uniche: 3</strong> (perché hai solo 3 giocatori diversi)
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.keys(inventory).sort((a, b) => b - a).map(rating => (
                  <div key={rating} className="bg-white/10 rounded-lg p-3">
                    <div className="text-yellow-400 font-bold mb-2">{rating} OVR</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-300 text-xs">Totali</label>
                        <input
                          type="number"
                          min="0"
                          value={inventory[rating].total}
                          onChange={(e) => updateInventory(rating, 'total', e.target.value)}
                          className="w-full bg-white/10 text-white rounded px-3 py-2 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-xs">Uniche</label>
                        <input
                          type="number"
                          min="0"
                          value={inventory[rating].unique}
                          onChange={(e) => updateInventory(rating, 'unique', e.target.value)}
                          className="w-full bg-white/10 text-white rounded px-3 py-2 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rose Obiettivo */}
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">🎯 Rose da Completare</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                {[93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80].map(rating => (
                  <button
                    key={rating}
                    onClick={() => addTargetSquad(rating)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 px-3 font-bold text-sm transition"
                  >
                    + {rating}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {targetSquads.sort((a, b) => b.rating - a.rating).map(target => (
                  <div key={target.rating} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg px-3 py-1 rounded">
                        {target.rating}
                      </div>
                      <span className="text-white font-semibold">x {target.count}</span>
                    </div>
                    <button
                      onClick={() => removeTargetSquad(target.rating)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-2 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={calculateSquads}
                disabled={targetSquads.length === 0 || calculating}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg py-3 px-6 font-bold flex items-center justify-center gap-2 transition"
              >
                <Play className="w-5 h-5" />
                {calculating ? 'Calcolo...' : 'Calcola Squadre'}
              </button>
            </div>
          </div>
        </div>

        {/* Risultati */}
        {solutions.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
              {solutions.map((sol) => (
                <div key={sol.squadNum} className={`backdrop-blur-lg rounded-xl shadow-xl p-6 border-2 ${sol.failed ? 'bg-red-900/20 border-red-500' : 'bg-white/10 border-white/20'}`}>
                  {sol.failed ? (
                    <div className="text-center">
                      <div className="text-red-400 text-xl font-bold mb-2">❌ Squadra #{sol.squadNum}</div>
                      <div className="text-white">Impossibile creare Rosa {sol.targetRating}</div>
                      <div className="text-gray-300 text-sm mt-2">Carte insufficienti</div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-6 h-6 text-yellow-400" />
                          <h2 className="text-xl font-bold text-white">Squadra #{sol.squadNum}</h2>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-2xl px-4 py-2 rounded-lg">
                          {sol.finalRating}
                        </div>
                      </div>
                      
                      <div className="mb-4 p-3 bg-white/5 rounded-lg">
                        <div className="text-gray-300 text-sm">Media Aggiustata: <span className="text-white font-semibold">{sol.adjustedAvg.toFixed(4)}</span></div>
                        <div className="text-gray-300 text-sm">Arrotondato: <span className="text-white font-semibold">{sol.rounded2Dec.toFixed(2)}</span></div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Composizione
                        </div>
                        {sol.players.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white/5 rounded px-3 py-2">
                            <span className="text-white font-semibold">{p.rating} OVR</span>
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              x{p.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">📊 Riepilogo Utilizzo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.keys(inventory).sort((a, b) => b - a).map(rating => {
                  const used = solutions.filter(s => !s.failed).reduce((sum, sol) => {
                    const player = sol.players?.find(p => p.rating === parseInt(rating));
                    return sum + (player ? player.count : 0);
                  }, 0);
                  const remaining = inventory[rating].total - used;
                  
                  return (
                    <div key={rating} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-yellow-400 font-bold text-lg">{rating}</div>
                      <div className="text-white text-sm">Usate: {used}</div>
                      <div className="text-gray-300 text-xs">Rimaste: {remaining}/{inventory[rating].total}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FIFASquadCalculator;
