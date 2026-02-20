
import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Calculator, Ruler, CheckCircle2, AlertCircle, Layers, ArrowDownUp, ChevronDown, Languages } from 'lucide-react';
import { ToleranceClass, FitCategory } from './types';
import { JIS_TOLERANCE_TABLE, FIT_RANGES, HOLE_FIT_DATA, SHAFT_FIT_DATA } from './constants';
import { Language, translations } from './translations';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('vi');
  const [mode, setMode] = useState<'general' | 'fit'>('fit');
  const [dimension, setDimension] = useState<string>('3');
  
  const [selectedClass, setSelectedClass] = useState<ToleranceClass>(ToleranceClass.M);
  const [fitCategory, setFitCategory] = useState<FitCategory>('shaft');
  const [fitClass, setFitClass] = useState<string>('h6');

  const t = translations[lang];

  // Robust sync between categories
  useEffect(() => {
    const targetClasses = fitCategory === 'hole' ? HOLE_FIT_DATA : SHAFT_FIT_DATA;
    const targetKeys = Object.keys(targetClasses);
    
    // Try to find the uppercase/lowercase version first
    const equivalent = fitCategory === 'hole' ? fitClass.toUpperCase() : fitClass.toLowerCase();
    
    if (targetKeys.includes(equivalent)) {
      setFitClass(equivalent);
    } else {
      // If no direct equivalent (e.g., b9 exists in Shaft but B9 doesn't exist in Hole)
      // find one that starts with the same letter, or just pick the first available
      const firstChar = equivalent.charAt(0).toUpperCase();
      const likelyCandidate = targetKeys.find(k => k.toUpperCase().startsWith(firstChar)) || targetKeys[0];
      setFitClass(likelyCandidate);
    }
  }, [fitCategory]);

  const activeRangeIndex = useMemo(() => {
    const val = parseFloat(dimension);
    if (isNaN(val) || val < 0) return -1;

    const ranges = mode === 'general' ? JIS_TOLERANCE_TABLE : FIT_RANGES;
    
    return ranges.findIndex((range) => {
      return val > range.min && val <= range.max;
    });
  }, [mode, dimension]);

  const calculationResult = useMemo(() => {
    const val = parseFloat(dimension);
    if (activeRangeIndex === -1) return null;

    if (mode === 'general') {
      const row = JIS_TOLERANCE_TABLE[activeRangeIndex];
      const tolerance = row[selectedClass];
      if (tolerance === undefined) return null;
      return {
        type: 'general',
        tolerance,
        upperLimit: val + tolerance,
        lowerLimit: val - tolerance,
        rangeText: `${row.min} - ${row.max}`,
        unit: 'mm'
      };
    } else {
      const dataSet = fitCategory === 'hole' ? HOLE_FIT_DATA : SHAFT_FIT_DATA;
      const deviations = dataSet[fitClass]?.[activeRangeIndex];
      
      if (!deviations) return null;

      const upperMm = deviations.upper / 1000;
      const lowerMm = deviations.lower / 1000;

      return {
        type: 'fit',
        upperDev: deviations.upper,
        lowerDev: deviations.lower,
        upperLimit: val + upperMm,
        lowerLimit: val + lowerMm, 
        rangeText: `${FIT_RANGES[activeRangeIndex].min} - ${FIT_RANGES[activeRangeIndex].max}`,
        unit: 'mm'
      };
    }
  }, [mode, dimension, activeRangeIndex, selectedClass, fitCategory, fitClass]);

  const fitClassesList = useMemo(() => {
    const classes = fitCategory === 'hole' ? Object.keys(HOLE_FIT_DATA) : Object.keys(SHAFT_FIT_DATA);
    return classes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [fitCategory]);

  const generalClasses = [
    { key: ToleranceClass.F, label: t.fine },
    { key: ToleranceClass.M, label: t.medium },
    { key: ToleranceClass.C, label: t.coarse },
    { key: ToleranceClass.V, label: t.extraCoarse },
  ];

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans">
      <header className="bg-slate-900 text-white pt-8 pb-12 px-4 shadow-xl border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/40">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{t.title}</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 shadow-inner">
              <div className="px-3 text-slate-500"><Languages className="w-4 h-4" /></div>
              {(['vi', 'en', 'jp'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 shadow-inner">
              <button onClick={() => setMode('general')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${mode === 'general' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>{t.general}</button>
              <button onClick={() => setMode('fit')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${mode === 'fit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>{t.fitSystem}</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 -mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg"><Calculator className="w-5 h-5 text-blue-600" /></div>
              <h2 className="text-lg font-bold text-slate-800">{t.parameters}</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.nominalSize}</label>
                <div className="relative group">
                  <input
                    type="number"
                    step="any"
                    value={dimension}
                    onChange={(e) => setDimension(e.target.value)}
                    className="w-full pl-5 pr-16 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none text-xl font-bold text-slate-900 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 border-l-2 border-slate-100 pl-3">
                    <span className="text-[11px] text-slate-900 font-black">mm</span>
                  </div>
                </div>
              </div>

              {mode === 'general' ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">{t.toleranceClass}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {generalClasses.map((item) => (
                      <button key={item.key} onClick={() => setSelectedClass(item.key)} className={`px-4 py-3 rounded-2xl text-left border-2 transition-all ${selectedClass === item.key ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md shadow-blue-200/50' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                        <div className="text-xs font-black uppercase">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setFitCategory('hole')} className={`px-4 py-4 rounded-2xl flex flex-col items-center border-2 transition-all ${fitCategory === 'hole' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500'}`}>
                      <Layers className="w-5 h-5 mb-1" />
                      <span className="text-xs font-black uppercase tracking-wider">{t.hole}</span>
                    </button>
                    <button onClick={() => setFitCategory('shaft')} className={`px-4 py-4 rounded-2xl flex flex-col items-center border-2 transition-all ${fitCategory === 'shaft' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500'}`}>
                      <ArrowDownUp className="w-5 h-5 mb-1" />
                      <span className="text-xs font-black uppercase tracking-wider">{t.shaft}</span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">{t.fitClass}</label>
                    <div className="relative group">
                      <select
                        value={fitClass}
                        onChange={(e) => setFitClass(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-lg text-slate-900 appearance-none cursor-pointer transition-all hover:bg-slate-100/50"
                      >
                        {fitClassesList.map(c => (
                          <option key={c} value={c} className="font-bold">
                            {c}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-blue-600 transition-colors">
                        <ChevronDown className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {calculationResult ? (
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">{t.calculatedResult}</span>
                  <h2 className="text-4xl font-black text-slate-900 flex items-baseline gap-3 mt-4">
                    {dimension} 
                    <span className="text-2xl text-blue-600 font-bold">
                      {mode === 'general' ? `±${calculationResult.tolerance}` : (
                        <div className="inline-flex flex-col text-sm align-middle ml-1">
                          <span className={`leading-tight font-mono font-bold ${calculationResult.upperDev >= 0 ? 'text-red-600' : 'text-blue-600'}`}>{calculationResult.upperDev > 0 ? '+' : ''}{calculationResult.upperDev}</span>
                          <span className={`leading-tight font-mono font-bold ${calculationResult.lowerDev >= 0 ? 'text-red-600' : 'text-blue-600'}`}>{calculationResult.lowerDev > 0 ? '+' : ''}{calculationResult.lowerDev}</span>
                        </div>
                      )}
                    </span>
                    <span className="text-[11px] font-black bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">μm</span>
                  </h2>
                  <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-widest">
                    {mode === 'general' ? t.general : t.fitSystem}: <span className="text-slate-900 font-bold">{mode === 'general' ? selectedClass.toUpperCase() : fitClass}</span> | {t.classRange}: <span className="text-blue-600 font-bold">{calculationResult.rangeText}</span> mm
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl shadow-inner"><CheckCircle2 className="w-10 h-10 text-blue-600" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-black block mb-2 tracking-widest">{t.maxLimit}</span>
                  <div className="flex items-baseline gap-2"><span className="text-3xl font-mono font-bold text-slate-900">{calculationResult.upperLimit.toFixed(3)}</span><span className="text-[11px] font-black">mm</span></div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-black block mb-2 tracking-widest">{t.minLimit}</span>
                  <div className="flex items-baseline gap-2"><span className="text-3xl font-mono font-bold text-slate-900">{calculationResult.lowerLimit.toFixed(3)}</span><span className="text-[11px] font-black">mm</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center">
              <AlertCircle className="w-16 h-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-bold text-slate-800">{t.inputReq}</h3>
              <p className="text-slate-500 text-sm mt-2">{t.inputReqDesc}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b flex items-center gap-2">
              <Ruler className="w-4 h-4 text-slate-600" /><h3 className="text-[10px] font-black uppercase tracking-widest">{t.snippet}</h3>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-[10px] border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-20">
                  <tr className="border-b">
                    <th className="px-4 py-3 font-black text-slate-400 uppercase border-r text-left bg-slate-50">{t.classRange}</th>
                    {(mode === 'general' ? JIS_TOLERANCE_TABLE : FIT_RANGES).map((r, i) => (
                      <th key={i} className={`px-2 py-3 text-center border-r font-mono whitespace-nowrap transition-colors ${activeRangeIndex === i ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}>
                        {r.min}-{r.max}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(mode === 'general' ? generalClasses.map(c => c.key) : fitClassesList).map(cls => {
                    const isRowActive = mode === 'general' ? selectedClass === cls : fitClass === cls;
                    return (
                      <tr key={cls} className={isRowActive ? 'bg-blue-50' : 'hover:bg-slate-50/50'}>
                        <td className={`px-4 py-2 font-black border-r sticky left-0 z-10 ${isRowActive ? 'text-blue-900 bg-blue-100' : 'bg-white text-slate-900'}`}>
                          {cls}
                        </td>
                        {(mode === 'general' ? JIS_TOLERANCE_TABLE : FIT_RANGES).map((_, idx) => {
                          const data = (mode === 'general' ? JIS_TOLERANCE_TABLE[idx][cls as ToleranceClass] : (fitCategory === 'hole' ? HOLE_FIT_DATA : SHAFT_FIT_DATA)[cls]?.[idx]);
                          const isActive = isRowActive && activeRangeIndex === idx;
                          return (
                            <td key={idx} className={`px-2 py-2 text-center border-r font-mono ${isActive ? 'bg-blue-500 text-white font-bold rounded-sm' : 'text-slate-500'}`}>
                              {typeof data === 'number' ? `±${data}` : (data ? `${data.upper}/${data.lower}` : '-')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
