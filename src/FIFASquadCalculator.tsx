import React, { useState } from 'react';
import { Calculator, Users, TrendingUp, Plus, Trash2, Play, Star } from 'lucide-react';

const FIFASquadCalculator = () => {
  const [inventory, setInventory] = useState({
    93: { total: 0, unique: 0, if: 0 },
    92: { total: 0, unique: 0, if: 0 },
    91: { total: 0, unique: 0, if: 0 },
    90: { total: 0, unique: 0, if: 0 },
    89: { total: 0, unique: 0, if: 0 },
    88: { total: 0, unique: 0, if: 0 },
    87: { total: 0, unique: 0, if: 0 },
    86: { total: 0, unique: 0, if: 0 },
    85: { total: 0, unique: 0, if: 0 },
    84: { total: 0, unique: 0, if: 0 },
    83: { total: 0, unique: 0, if: 0 },
    82: { total: 0, unique: 0, if: 0 },
    81: { total: 0, unique: 0, if: 0 },
    80: { total: 0, unique: 0, if: 0 }
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
    let score = 0;
    for (const [rating, count] of counts) {
      const ratingNum = parseInt(rating);
      score += count * count * (ratingNum / 80);
    }
    return score;
  };

  // Funzione per verificare le combinazioni fallback
  const tryFallbackPatterns = (targetRating, available, needsIF = false) => {
    const patterns = [
      // Pattern 1: 1x(+1), 6x(=), 3x(-1), 1x(-2)
      { pattern: { [targetRating + 1]: 1, [targetRating]: 6, [targetRating - 1]: 3, [targetRating - 2]: 1 }, name: "1x(+1), 6x(=), 3x(-1), 1x(-2)" },
      // Pattern 2: 9x(=), 2x(-1)
      { pattern: { [targetRating]: 9, [targetRating - 1]: 2 }, name: "9x(=), 2x(-1)" },
      // Pattern 3: 2x(+1), 3x(=), 6x(-1)
      { pattern: { [targetRating + 1]: 2, [targetRating]: 3, [targetRating - 1]: 6 }, name: "2x(+1), 3x(=), 6x(-1)" },
      // Pattern 4: 3x(+1), 2x(=), 3x(-1), 3x(-2)
      { pattern: { [targetRating + 1]: 3, [targetRating]: 2, [targetRating - 1]: 3, [targetRating - 2]: 3 }, name: "3x(+1), 2x(=), 3x(-1), 3x(-2)" }
    ];

    for (const { pattern, name } of patterns) {
      // Verifica se tutte le valutazioni richieste sono disponibili nell'inventario
      const allRatingsAvailable = Object.keys(pattern).every(rating => {
        const ratingNum = parseInt(rating);
        return ratingNum >= 80 && ratingNum <= 93 && available[rating] !== undefined;
      });

      if (!allRatingsAvailable) continue;

      // Verifica la disponibilità delle carte
      let hasEnoughCards = true;
      const testCombo = {};
      
      for (const [rating, count] of Object.entries(pattern)) {
        const ratingNum = parseInt(rating);
        if (available[ratingNum].available < count) {
          hasEnoughCards = false;
          break;
        }
        testCombo[ratingNum] = count;
      }

      if (!hasEnoughCards) continue;

      // Verifica il rating FIFA
      const players = [];
      for (const [rating, count] of Object.entries(testCombo)) {
        players.push({ rating: parseInt(rating), count });
      }

      const { adjustedAvg, finalRating } = calculateFIFARating(players);
      const minTarget = targetRating - 1 + 0.96;
      const maxTarget = targetRating + 0.95;

      if (finalRating === targetRating && adjustedAvg >= minTarget && adjustedAvg <= maxTarget) {
        // Controllo requisito IF
        let ifRating = null;
        let replacedRating = null;

        if (needsIF) {
          // Cerca la carta più bassa da sostituire con una IF
          const sortedRatings = Object.keys(testCombo)
            .map(Number)
            .sort((a, b) => a - b);

          const availableIFs = Object.keys(available)
            .map(Number)
            .filter(r => available[r].if > 0)
            .sort((a, b) => a - b);

          let replaced = false;

          for (const ifRatingCandidate of availableIFs) {
            if (replaced) break;

            for (const rating of sortedRatings) {
              const newCombo = { ...testCombo };
              newCombo[rating] = (newCombo[rating] || 0) - 1;
              if (newCombo[rating] === 0) delete newCombo[rating];
              newCombo[ifRatingCandidate] = (newCombo[ifRatingCandidate] || 0) + 1;

              // Verifica disponibilità
              if (newCombo[rating] !== undefined && newCombo[rating] < 0) continue;
              if (newCombo[ifRatingCandidate] > available[ifRatingCandidate].available + 1) continue;

              // Verifica rating
              const newPlayers = [];
              for (const [r, count] of Object.entries(newCombo)) {
                if (count > 0) {
                  newPlayers.push({ rating: parseInt(r), count });
                }
              }

              const { adjustedAvg: newAvg, finalRating: newFinal } = calculateFIFARating(newPlayers);
              if (newFinal === targetRating && newAvg >= minTarget && newAvg <= maxTarget) {
                Object.assign(testCombo, newCombo);
                ifRating = ifRatingCandidate;
                replacedRating = rating;
                replaced = true;
                break;
              }
            }
          }

          if (needsIF && !replaced) continue;
        }

        return {
          combo: testCombo,
          patternName: name,
          ifRating,
          replacedRating
        };
      }
    }

    return null;
  };

  const findCombination = (targetRating, available, needsIF = false) => {
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
    
    if (validCombinations.length === 0) {
      // Prova le combinazioni fallback
      return tryFallbackPatterns(targetRating, available, needsIF);
    }
    
    // Ordina per: 1) media aggiustata più bassa (più vicina al minimo), 2) diversità
    validCombinations.sort((a, b) => {
      const playersA = [];
      const playersB = [];
      
      for (const [rating, count] of Object.entries(a)) {
        if (count > 0) playersA.push({ rating: parseInt(rating), count });
      }
      for (const [rating, count] of Object.entries(b)) {
        if (count > 0) playersB.push({ rating: parseInt(rating), count });
      }
      
      const { adjustedAvg: avgA } = calculateFIFARating(playersA);
      const { adjustedAvg: avgB } = calculateFIFARating(playersB);
      
      // Preferisci la media più bassa (più vicina al targetRating)
      if (Math.abs(avgA - avgB) > 0.01) {
        return avgA - avgB;
      }
      
      // A parità di media, preferisci maggiore diversità (meno carte alte)
      return calculateDiversityScore(a) - calculateDiversityScore(b);
    });
    
    let bestCombo = validCombinations[0];
    let ifRating = null;
    let replacedRating = null;
    
    // Se serve una IF, sostituisci una carta con una IF disponibile
    if (needsIF) {
      // Prova a sostituire una carta con una IF, cercando di usare la IF più BASSA possibile
      const sortedRatings = Object.keys(bestCombo)
        .filter(r => bestCombo[r] > 0)
        .map(Number)
        .sort((a, b) => a - b); // Ordina dal più basso al più alto
      
      // Trova tutte le IF disponibili ordinate dal più basso al più alto
      const availableIFs = ratings
        .filter(r => available[r].if > 0)
        .sort((a, b) => a - b);
      
      let replaced = false;
      
      // Prova prima a sostituire con la IF più bassa disponibile
      for (const ifRatingCandidate of availableIFs) {
        if (replaced) break;
        
        // Per ogni IF, prova a sostituire una carta partendo dalle più basse
        for (const rating of sortedRatings) {
          // Prova a sostituire una carta di 'rating' con una IF di 'ifRatingCandidate'
          const testCombo = { ...bestCombo };
          testCombo[rating] = (testCombo[rating] || 0) - 1;
          if (testCombo[rating] === 0) delete testCombo[rating];
          testCombo[ifRatingCandidate] = (testCombo[ifRatingCandidate] || 0) + 1;
          
          // Verifica che abbiamo abbastanza carte
          if (testCombo[rating] !== undefined && testCombo[rating] < 0) continue;
          if (testCombo[ifRatingCandidate] > available[ifRatingCandidate].available + 1) continue;
          
          // Calcola il nuovo rating
          const players = [];
          for (const [r, count] of Object.entries(testCombo)) {
            if (count > 0) {
              players.push({ rating: parseInt(r), count });
            }
          }
          
          const { adjustedAvg, finalRating } = calculateFIFARating(players);
          if (finalRating === targetRating && adjustedAvg >= minTarget && adjustedAvg <= maxTarget) {
            bestCombo = testCombo;
            ifRating = ifRatingCandidate;
            replacedRating = rating;
            replaced = true;
            break;
          }
        }
      }
      
      if (!replaced) return null; // Non possiamo soddisfare il requisito IF
    }
    
    return { 
      combo: bestCombo,
      ifRating,
      replacedRating
    };
  };

  const calculateSquads = () => {
    setCalculating(true);
    setTimeout(() => {
      const sortedTargets = [...targetSquads].sort((a, b) => b.rating - a.rating);
      
      const available = {};
      for (const [rating, data] of Object.entries(inventory)) {
        available[rating] = { 
          available: data.total, 
          unique: data.unique,
          if: data.if
        };
      }
      
      const result = [];
      let squadNum = 1;
      
      for (const target of sortedTargets) {
        for (let i = 0; i < target.count; i++) {
          const comboResult = findCombination(target.rating, available, target.needsIF);
          
          if (comboResult) {
            const combo = comboResult.combo;
            
            // Sottrai le carte usate
            for (const [rating, count] of Object.entries(combo)) {
              if (count > 0) {
                available[rating].available -= count;
              }
            }
            
            // Se abbiamo usato una IF, sottraiamola
            if (comboResult.ifRating) {
              available[comboResult.ifRating].if -= 1;
              // Restituisci la carta Oro che è stata sostituita
              if (comboResult.replacedRating) {
                available[comboResult.replacedRating].available += 1;
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
              players,
              needsIF: target.needsIF,
              ifRating: comboResult.ifRating,
              replacedRating: comboResult.replacedRating,
              patternName: comboResult.patternName || null
            });
          } else {
            result.push({
              squadNum: squadNum++,
              targetRating: target.rating,
              needsIF: target.needsIF,
              failed: true
            });
          }
        }
      }
      
      setSolutions(result);
      setCalculating(false);
    }, 100);
  };

  // ... il resto del codice rimane invariato ...

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
                <strong>💡 Come funziona:</strong> Se hai 5 carte 89 (Kane, Kane, Kane, Russo, Shaw), metti <strong>Totali: 5</strong> e <strong>Uniche: 3</strong> (perché hai solo 3 giocatori diversi). Le carte IF non richiedono distinzione tra totali e uniche.
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.keys(inventory).sort((a, b) => b - a).map(rating => (
                  <div key={rating} className="bg-white/10 rounded-lg p-3">
                    <div className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                      {rating} OVR
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-gray-300 text-xs">Totali</label>
                        <input
                          type="number"
                          min="0"
                          value={inventory[rating].total}
                          onChange={(e) => updateInventory(rating, 'total', e.target.value)}
                          className="w-full bg-white/10 text-white rounded px-2 py-2 mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-xs">Uniche</label>
                        <input
                          type="number"
                          min="0"
                          value={inventory[rating].unique}
                          onChange={(e) => updateInventory(rating, 'unique', e.target.value)}
                          className="w-full bg-white/10 text-white rounded px-2 py-2 mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-gray-300 text-xs flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400" />
                          IF
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={inventory[rating].if}
                          onChange={(e) => updateInventory(rating, 'if', e.target.value)}
                          className="w-full bg-yellow-900/30 text-white rounded px-2 py-2 mt-1 text-sm border border-yellow-600/50"
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
                {targetSquads.sort((a, b) => b.rating - a.rating || (a.needsIF ? 1 : -1)).map((target, idx) => (
                  <div key={idx} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`font-bold text-lg px-3 py-1 rounded ${target.needsIF ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'}`}>
                        {target.rating}
                      </div>
                      <span className="text-white font-semibold">x {target.count}</span>
                      {target.needsIF && (
                        <div className="flex items-center gap-1 bg-yellow-600/30 px-2 py-1 rounded text-yellow-300 text-xs">
                          <Star className="w-3 h-3" />
                          IF
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleIF(target.rating, target.needsIF)}
                        className={`p-2 rounded-lg transition ${target.needsIF ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                        title={target.needsIF ? 'Sposta a senza IF' : 'Sposta a con IF'}
                      >
                        <Star className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => removeTargetSquad(target.rating, target.needsIF)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-2 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                      {sol.needsIF && (
                        <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm mt-2">
                          <Star className="w-4 h-4" />
                          Con requisito IF
                        </div>
                      )}
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
                      
                      {sol.patternName && (
                        <div className="mb-3 bg-green-600/20 border border-green-600/50 rounded-lg p-2 text-green-300 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Combinazione Predefinita:</span>
                            <span>{sol.patternName}</span>
                          </div>
                        </div>
                      )}
                      
                      {sol.needsIF && sol.ifRating && (
                        <div className="mb-3 bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-2 text-yellow-300 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Star className="w-4 h-4" />
                            <span className="font-semibold">Carta IF utilizzata:</span>
                          </div>
                          <div className="ml-6 text-xs">
                            {sol.replacedRating && (
                              <span>Sostituita 1x {sol.replacedRating} OVR con 1x {sol.ifRating} IF</span>
                            )}
                          </div>
                        </div>
                      )}
                      
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
                  const usedIF = solutions.filter(s => !s.failed && s.ifRating === parseInt(rating)).length;
                  const remaining = inventory[rating].total - used;
                  const remainingIF = inventory[rating].if - usedIF;
                  
                  return (
                    <div key={rating} className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-yellow-400 font-bold text-lg">{rating}</div>
                      <div className="text-white text-sm">Usate: {used}</div>
                      <div className="text-gray-300 text-xs">Oro: {remaining}/{inventory[rating].total}</div>
                      {inventory[rating].if > 0 && (
                        <div className="text-yellow-300 text-xs flex items-center justify-center gap-1 mt-1">
                          <Star className="w-3 h-3" />
                          IF: {remainingIF}/{inventory[rating].if}
                        </div>
                      )}
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
