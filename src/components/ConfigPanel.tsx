import React, { useState, useEffect } from 'react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, getSupabaseClient, SQL_SETUP_SCRIPT } from '../lib/supabase';
import { SupabaseConfig } from '../types';
import { Database, Link, AlertTriangle, CheckCircle, Copy, Check, Trash2, Shield, Info } from 'lucide-react';

interface ConfigPanelProps {
  onConfigChanged: () => void;
}

export default function ConfigPanel({ onConfigChanged }: ConfigPanelProps) {
  const [config, setConfig] = useState<SupabaseConfig>({ url: '', anonKey: '', isCustom: false });
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const active = getSupabaseConfig();
    setConfig(active);
    setInputUrl(active.url);
    setInputKey(active.anonKey);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl || !inputKey) {
      setTestStatus('error');
      setTestMessage('Por favor completa ambos campos.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Validando conexión...');

    // Save temporarily to test
    saveSupabaseConfig(inputUrl, inputKey);
    onConfigChanged();

    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('No se pudo inicializar la instancia.');
      }

      // Try checking if a test query works
      const { data, error } = await client
        .from('player_profiles')
        .select('nickname')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // Ignore "no row found" error, it's valid
        throw error;
      }

      setTestStatus('success');
      setTestMessage('¡Conexión establecida con éxito! Ya puedes iniciar sesión y competir.');
      
      const active = getSupabaseConfig();
      setConfig(active);
    } catch (err: any) {
      console.error('Supabase test error:', err);
      setTestStatus('error');
      setTestMessage(
        `Error de conexión: ${err.message || 'Verifica la URL, el Anon Key y que hayas ejecutado la consulta SQL en Supabase.'}`
      );
      // Revert/Clear if custom, or keep for correction
    }
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setInputUrl('');
    setInputKey('');
    setTestStatus('idle');
    setTestMessage('');
    onConfigChanged();
    
    const active = getSupabaseConfig();
    setConfig(active);
  };

  const copySql = () => {
    navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="supabase-config-panel" className="bg-slate-900 border-2 border-indigo-500/20 p-6 rounded-xl text-slate-100 shadow-2xl max-w-2xl mx-auto my-6 font-sans">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
        <Database className="w-8 h-8 text-indigo-400" />
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-white mb-0.5">
            Configuración de Base de Datos
          </h2>
          <p className="text-xs text-slate-400">
            Conecta tu propia cuenta de Supabase para activar estadísticas y tablas reales.
          </p>
        </div>
      </div>

      {/* Connection Status Badge */}
      <div className="mb-6">
        {config.url ? (
          <div className="flex items-start gap-3 bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Conectado a la Nube (Supabase)
              </p>
              <p className="text-xs text-emerald-400/80 mt-1">
                Servidor activo en: <code className="bg-emerald-950/60 px-1 py-0.5 rounded text-slate-300 font-mono text-[10px] break-all">{config.url}</code>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-indigo-950/25 border border-indigo-505/20 p-4 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-indigo-300">
                Modo Offline (LocalStorage)
              </p>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                El juego guardará todo tu progreso localmente en este navegador. Para competir con otros jugadores en un marcador global en tiempo real, configura las credenciales de tu proyecto Supabase abajo.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Link className="w-4 h-4 text-slate-400" /> Credenciales Supabase
          </h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">SUPABASE_URL</label>
            <input
              type="text"
              placeholder="https://xxxxxx.supabase.co"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">SUPABASE_ANON_KEY (Public API Key)</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={testStatus === 'testing'}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-semibold cursor-pointer text-white transition-colors py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-indigo-950/25"
            >
              {testStatus === 'testing' ? 'Verificando...' : 'Conectar Servidor'}
            </button>
            {config.url && (
              <button
                type="button"
                onClick={handleClear}
                className="bg-slate-850 hover:bg-red-950 hover:text-red-400 p-2 rounded-lg text-slate-400 transition-colors cursor-pointer"
                title="Desconectar y usar LocalStorage"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-lg text-xs leading-normal font-sans border ${
              testStatus === 'success' ? 'bg-emerald-950/20 text-emerald-300 border-emerald-500/20' :
              testStatus === 'error' ? 'bg-red-950/20 text-red-300 border-red-500/20' :
              'bg-blue-950/20 text-blue-300 border-blue-500/20'
            }`}>
              {testMessage}
            </div>
          )}
        </form>

        {/* Database Setup Helper Instructions */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 mb-2">
              <Shield className="w-4 h-4 text-indigo-400" /> ¿Cómo iniciar?
            </h3>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside leading-relaxed mb-4">
              <li>Crea un proyecto gratis en <strong>Supabase</strong>.</li>
              <li>Ve a la pestaña <b>SQL Editor</b>.</li>
              <li>Haz clic en <b>New Query</b>, pega el script de abajo y corre <b>Run</b>.</li>
              <li>Busca tus credenciales en <b>Project Settings &gt; API</b> y pégalas arriba.</li>
            </ol>
          </div>

          <div className="pt-2 border-t border-slate-900">
            <button
              type="button"
              onClick={copySql}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>¡Código SQL Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copiar Script SQL de Configuración</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2.5 flex items-center justify-center gap-1">
              <Info className="w-3 h-3 text-slate-500 shrink-0" /> Genera las tablas `player_profiles` y `level_progress`.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
