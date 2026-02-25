import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { Song, SongSection } from '../types/song';

type View = 'library' | 'player';

export function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [view, setView] = useState<View>('library');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    api.getSongs().then(data => setSongs(data.songs || [])).catch(() => {});
  }, []);

  const handleAddSong = async (song: Song) => {
    const updated = [...songs, song];
    setSongs(updated);
    await api.saveSongs({ songs: updated, updatedAt: new Date().toISOString() }).catch(() => {});
    setShowAddForm(false);
  };

  const handleUpdateSong = async (song: Song) => {
    const updated = songs.map(s => s.id === song.id ? song : s);
    setSongs(updated);
    await api.saveSongs({ songs: updated, updatedAt: new Date().toISOString() }).catch(() => {});
  };

  const handleDeleteSong = async (id: string) => {
    const updated = songs.filter(s => s.id !== id);
    setSongs(updated);
    await api.saveSongs({ songs: updated, updatedAt: new Date().toISOString() }).catch(() => {});
    if (activeSong?.id === id) {
      setActiveSong(null);
      setView('library');
    }
  };

  if (view === 'player' && activeSong) {
    return (
      <SongPlayer
        song={activeSong}
        onBack={() => setView('library')}
        onUpdateSong={handleUpdateSong}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pt-8 md:pt-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl text-amber-400 glow-text">Songs</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-all"
        >
          + Add Song
        </button>
      </div>

      {showAddForm && (
        <AddSongForm onSubmit={handleAddSong} onCancel={() => setShowAddForm(false)} />
      )}

      {songs.length === 0 && !showAddForm ? (
        <div className="text-center py-20">
          <div className="text-text-muted mb-2">No songs yet</div>
          <div className="text-sm text-text-muted">Add a song to start practicing</div>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map(song => (
            <div
              key={song.id}
              className="group flex items-center gap-4 p-4 rounded-lg bg-surface border border-border hover:border-amber-500/20 transition-all cursor-pointer"
              onClick={() => { setActiveSong(song); setView('player'); }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-text-primary font-medium truncate">{song.title}</div>
                <div className="text-sm text-text-muted truncate">{song.artist}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {song.tuning !== 'Standard' && (
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-raised text-text-muted">{song.tuning}</span>
                )}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className={`w-1.5 h-3 rounded-sm ${n <= song.difficulty ? 'bg-amber-500' : 'bg-border'}`} />
                  ))}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteSong(song.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-400 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Song Form ───

function AddSongForm({ onSubmit, onCancel }: { onSubmit: (s: Song) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [tuning, setTuning] = useState('Standard');
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      id: crypto.randomUUID(),
      title: title.trim(),
      artist: artist.trim(),
      tuning,
      difficulty,
      sections: [],
      tags: [],
      addedAt: new Date().toISOString(),
      practiceCount: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-surface border border-border mb-6 space-y-3">
      <input
        type="text" placeholder="Song title" value={title} onChange={e => setTitle(e.target.value)}
        className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50"
        autoFocus
      />
      <input
        type="text" placeholder="Artist" value={artist} onChange={e => setArtist(e.target.value)}
        className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50"
      />
      <div className="flex gap-3">
        <select value={tuning} onChange={e => setTuning(e.target.value)}
          className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-amber-500/50">
          {['Standard', 'Drop D', 'Open G', 'Open D', 'DADGAD', 'Eb Standard', 'Half Step Down'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {([1,2,3,4,5] as const).map(n => (
            <button key={n} type="button" onClick={() => setDifficulty(n)}
              className={`w-4 h-6 rounded-sm transition-colors ${n <= difficulty ? 'bg-amber-500' : 'bg-border hover:bg-surface-overlay'}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="px-4 py-2 rounded-lg bg-amber-500 text-void text-sm font-medium hover:bg-amber-400 transition-colors">
          Add Song
        </button>
      </div>
    </form>
  );
}

// ─── Song Player ───

function SongPlayer({ song, onBack, onUpdateSong }: {
  song: Song;
  onBack: () => void;
  onUpdateSong: (s: Song) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragModeRef = useRef<'start' | 'end' | null>(null);
  // Refs that mirror loop state — avoids stale closures in the global effect
  const loopStartRef = useRef<number | null>(null);
  const loopEndRef = useRef<number | null>(null);

  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [pitchShift, setPitchShift] = useState(0);

  // Loop region
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  // Sections
  const [sections, setSections] = useState<SongSection[]>(song.sections);
  const [newSectionName, setNewSectionName] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSectionEditorOpen, setIsSectionEditorOpen] = useState(false);
  const activeSectionData = activeSection ? sections.find(s => s.id === activeSection) ?? null : null;
  const [showPlaybackPanel, setShowPlaybackPanel] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('songs-player-show-playback');
    return saved ? saved === 'true' : true;
  });
  const [showSectionsPanel, setShowSectionsPanel] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = window.localStorage.getItem('songs-player-show-sections');
    return saved ? saved === 'true' : true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoSrc(URL.createObjectURL(file));
  };

  // Video events — videoSrc in deps so listeners attach when video element appears
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (isLooping && loopStart !== null && loopEnd !== null && video.currentTime >= loopEnd) {
        video.currentTime = loopStart;
      }
    };
    const onLoaded = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    if (video.readyState >= 1) setDuration(video.duration);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [isLooping, loopStart, loopEnd, videoSrc]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    window.localStorage.setItem('songs-player-show-playback', String(showPlaybackPanel));
  }, [showPlaybackPanel]);

  useEffect(() => {
    window.localStorage.setItem('songs-player-show-sections', String(showSectionsPanel));
  }, [showSectionsPanel]);

  // Keep refs in sync so the global effect doesn't go stale
  loopStartRef.current = loopStart;
  loopEndRef.current = loopEnd;

  // Global mouse handlers so drag works even if cursor leaves the timeline div
  useEffect(() => {
    const getTime = (clientX: number) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect || !duration) return 0;
      return Math.max(0, Math.min(duration, ((clientX - rect.left) / rect.width) * duration));
    };

    const onMouseMove = (e: MouseEvent) => {
      const mode = dragModeRef.current;
      if (!mode) return;
      const t = getTime(e.clientX);

      if (mode === 'start') {
        const newStart = Math.min(t, (loopEndRef.current ?? duration) - 0.1);
        loopStartRef.current = newStart;
        setLoopStart(newStart);
        return;
      }

      if (mode === 'end') {
        const newEnd = Math.max(t, (loopStartRef.current ?? 0) + 0.1);
        loopEndRef.current = newEnd;
        setLoopEnd(newEnd);
      }
    };

    const onMouseUp = () => {
      const mode = dragModeRef.current;
      if (!mode) return;
      dragModeRef.current = null;

      if (mode === 'start') {
        // Seek video to new loop start on release
        if (videoRef.current) videoRef.current.currentTime = loopStartRef.current ?? 0;
        return;
      }
      if (mode === 'end') return;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [duration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  };

  const clearLoop = () => {
    setLoopStart(null);
    loopStartRef.current = null;
    setLoopEnd(null);
    loopEndRef.current = null;
    setIsLooping(false);
    setActiveSection(null);
    setNewSectionName('');
    setIsSectionEditorOpen(false);
  };

  const markLoopStart = () => {
    const t = videoRef.current?.currentTime ?? currentTime;
    setLoopStart(t);
    loopStartRef.current = t;
    setLoopEnd(null);
    loopEndRef.current = null;
    setIsLooping(false);
    setActiveSection(null);
    setNewSectionName('');
    setIsSectionEditorOpen(false);
  };

  const markLoopEnd = () => {
    if (loopStart === null) return;
    const t = videoRef.current?.currentTime ?? currentTime;
    const end = Math.max(t, loopStart + 0.1);
    setLoopEnd(end);
    loopEndRef.current = end;
    setIsLooping(true);
    setActiveSection(null);
  };

  const activateSection = (section: SongSection) => {
    setLoopStart(section.startTime);
    setLoopEnd(section.endTime);
    setIsLooping(true);
    setActiveSection(section.id);
    setNewSectionName(section.name);
    if (videoRef.current) videoRef.current.currentTime = section.startTime;
  };

  const addSection = () => {
    if (!newSectionName.trim() || loopStart === null || loopEnd === null) return;
    const section: SongSection = {
      id: crypto.randomUUID(),
      name: newSectionName.trim(),
      startTime: loopStart,
      endTime: loopEnd,
      mastered: false,
    };
    const updated = [...sections, section];
    setSections(updated);
    onUpdateSong({ ...song, sections: updated });
    setNewSectionName(section.name);
    setActiveSection(section.id);
  };

  const updateActiveSection = () => {
    if (!activeSectionData || loopStart === null || loopEnd === null) return;
    const updatedName = newSectionName.trim() || activeSectionData.name;
    const updated = sections.map(section => section.id === activeSectionData.id
      ? { ...section, name: updatedName, startTime: loopStart, endTime: loopEnd }
      : section);
    setSections(updated);
    onUpdateSong({ ...song, sections: updated });
    setNewSectionName(updatedName);
  };

  const saveSection = () => {
    if (activeSectionData) {
      updateActiveSection();
      return;
    }
    addSection();
  };

  const deleteSection = (id: string) => {
    const updated = sections.filter(s => s.id !== id);
    setSections(updated);
    onUpdateSong({ ...song, sections: updated });
    if (activeSection === id) clearLoop();
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const getTimelineLimit = () => {
    const maxDuration = duration > 0 ? duration : (videoRef.current?.duration ?? 0);
    return Number.isFinite(maxDuration) && maxDuration > 0 ? maxDuration : null;
  };

  const updateLoopStartSeconds = (rawValue: string) => {
    if (loopStart === null || loopEnd === null || rawValue === '') return;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;

    const maxDuration = getTimelineLimit();
    const bounded = maxDuration === null
      ? Math.max(0, parsed)
      : Math.max(0, Math.min(maxDuration, parsed));
    const nextStart = Math.min(bounded, loopEnd - 0.1);

    setLoopStart(nextStart);
    loopStartRef.current = nextStart;
  };

  const updateLoopEndSeconds = (rawValue: string) => {
    if (loopStart === null || loopEnd === null || rawValue === '') return;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;

    const maxDuration = getTimelineLimit();
    const bounded = maxDuration === null
      ? Math.max(loopStart + 0.1, parsed)
      : Math.max(loopStart + 0.1, Math.min(maxDuration, parsed));

    setLoopEnd(bounded);
    loopEndRef.current = bounded;
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    const maxDuration = duration > 0 ? duration : (video?.duration ?? 0);
    if (!maxDuration) return;
    const base = video?.currentTime ?? currentTime;
    const target = Math.max(0, Math.min(maxDuration, base + seconds));
    if (video) video.currentTime = target;
    setCurrentTime(target);
  };

  const showPlayback = Boolean(videoSrc && showPlaybackPanel);
  const showSections = Boolean(videoSrc && showSectionsPanel);
  const focusMode = Boolean(videoSrc && !showPlayback && !showSections);

  return (
    <div className={`w-full max-w-none mx-auto px-1.5 md:px-2.5 lg:px-3.5 ${focusMode ? 'pt-3 md:pt-4' : 'pt-4 md:pt-6'}`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center gap-3 ${focusMode ? 'mb-3' : 'mb-4 md:mb-5'}`}>
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-surface-raised text-text-muted hover:text-text-primary transition-all">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-display text-text-primary truncate">{song.title}</h1>
          <p className="text-sm text-text-muted">{song.artist}</p>
        </div>
        {videoSrc && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPlaybackPanel(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                showPlaybackPanel
                  ? 'border-amber-500/35 text-amber-400 bg-amber-500/10'
                  : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {showPlaybackPanel ? 'Hide Playback' : 'Show Playback'}
            </button>
            <button
              type="button"
              onClick={() => setShowSectionsPanel(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                showSectionsPanel
                  ? 'border-amber-500/35 text-amber-400 bg-amber-500/10'
                  : 'border-border text-text-muted hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {showSectionsPanel ? `Hide Sections (${sections.length})` : `Show Sections (${sections.length})`}
            </button>
          </div>
        )}
      </div>

      <div className={`grid gap-2 md:gap-3 xl:gap-4 ${
        videoSrc
          ? showPlayback && showSections
            ? 'xl:grid-cols-[12rem_minmax(0,1fr)_12rem] xl:items-start'
            : showPlayback
              ? 'xl:grid-cols-[13rem_minmax(0,1fr)] xl:items-start'
              : showSections
                ? 'xl:grid-cols-[minmax(0,1fr)_13rem] xl:items-start'
                : 'xl:grid-cols-[minmax(0,1fr)]'
          : ''
      }`}>
        {showPlayback && (
          <aside className="rounded-xl border border-border bg-surface/80 p-3 xl:sticky xl:top-5 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto">
            <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">Playback</h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-text-muted mb-2 block">Speed: {Math.round(playbackRate * 100)}%</label>
                <input type="range" min={25} max={200} value={playbackRate * 100}
                  onChange={e => setPlaybackRate(Number(e.target.value) / 100)}
                  className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer accent-amber-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500" />
                <div className="flex gap-1 mt-1 flex-wrap">
                  {[0.5, 0.75, 1, 1.25].map(r => (
                    <button key={r} onClick={() => setPlaybackRate(r)}
                      className={`text-xs px-2 py-0.5 rounded ${playbackRate === r ? 'bg-amber-500/15 text-amber-400' : 'text-text-muted hover:text-text-secondary'}`}>
                      {r === 1 ? '1x' : `${r}x`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-text-muted mb-2 block">Volume: {Math.round(volume * 100)}%</label>
                <input type="range" min={0} max={1} step={0.01} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer accent-amber-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500" />
                <div className="flex gap-1 mt-1 flex-wrap">
                  {[0.25, 0.5, 0.75, 1].map(v => (
                    <button key={v} onClick={() => setVolume(v)}
                      className={`text-xs px-2 py-0.5 rounded ${volume === v ? 'bg-amber-500/15 text-amber-400' : 'text-text-muted hover:text-text-secondary'}`}>
                      {Math.round(v * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-text-muted mb-2 block">
                  Pitch: {pitchShift > 0 ? `+${pitchShift}` : pitchShift} st
                </label>
                <input type="range" min={-6} max={6} value={pitchShift}
                  onChange={e => setPitchShift(Number(e.target.value))}
                  className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer accent-amber-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500" />
                <div className="text-xs text-text-muted mt-1">(Pitch shift requires Web Audio)</div>
              </div>
            </div>
          </aside>
        )}

        <div className="min-w-0">
          {/* Video area */}
          <div className={`relative rounded-xl overflow-hidden bg-surface border border-border ${focusMode ? 'mb-2' : 'mb-3'}`}>
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className={focusMode ? 'w-full h-[52dvh] max-h-[56dvh] object-contain bg-black' : 'w-full aspect-video'}
                onClick={togglePlay}
              />
            ) : (
              <label className="flex flex-col items-center justify-center aspect-video cursor-pointer hover:bg-surface-raised transition-colors">
                <svg className="w-12 h-12 text-text-muted mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M12 9v6M9 12h6" />
                </svg>
                <span className="text-sm text-text-muted">Load a video file</span>
                <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
              </label>
            )}
          </div>

          {videoSrc && (
            <div className={focusMode ? 'sticky bottom-2 z-20 rounded-xl border border-border bg-void/90 backdrop-blur-md p-2 md:p-3' : ''}>
              {/* ── Timeline ── */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 mr-auto">
                    <button
                      onClick={markLoopStart}
                      className="px-3 py-1 rounded-md text-[11px] border border-amber-500/35 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
                    >
                      Start loop
                    </button>

                    {loopStart !== null && loopEnd !== null && (
                      <span className="px-2 py-1 text-[11px] tabular-nums text-amber-400/80">
                        {formatTime(loopStart)} → {formatTime(loopEnd)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    {[-10, -5, -1, 1, 5, 10].map(step => (
                      <button
                        key={step}
                        onClick={() => seekBy(step)}
                        className={`px-2.5 py-1 rounded-md text-[11px] tabular-nums border transition-all ${
                          step > 0
                            ? 'text-amber-400 border-amber-500/30 bg-amber-500/[0.05] hover:bg-amber-500/15'
                            : 'text-text-muted border-border hover:text-text-primary hover:bg-surface-raised'
                        }`}
                      >
                        {step > 0 ? `+${step}s` : `${step}s`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Track — click to seek, drag handles to adjust loop edges */}
                <div
                  ref={timelineRef}
                  className={`relative rounded-lg overflow-hidden bg-surface border border-border cursor-pointer select-none mb-2 ${
                    focusMode ? 'h-9' : 'h-11'
                  }`}
                  onMouseDown={e => {
                    e.preventDefault();
                    if (e.button !== 0) return;
                    if (!duration) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const t = Math.max(0, Math.min(duration, ((e.clientX - rect.left) / rect.width) * duration));
                    if (videoRef.current) videoRef.current.currentTime = t;
                    setCurrentTime(t);
                  }}
                >
                  {/* Played portion */}
                  <div
                    className="absolute top-0 left-0 h-full bg-white/[0.03] pointer-events-none"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />

                  {/* Saved sections */}
                  {sections.map(s => (
                    <div
                      key={s.id}
                      className={`absolute top-0 h-full cursor-pointer transition-colors ${
                        activeSection === s.id
                          ? 'bg-sky-500/30 border-l-2 border-r-2 border-sky-400'
                          : 'bg-surface-raised/50 border-l border-r border-border hover:bg-surface-raised'
                      }`}
                      style={{ left: `${(s.startTime / duration) * 100}%`, width: `${((s.endTime - s.startTime) / duration) * 100}%` }}
                      onClick={e => { e.stopPropagation(); activateSection(s); }}
                      title={s.name}
                    />
                  ))}

                  {/* Active loop region + edge handles */}
                  {loopStart !== null && loopEnd !== null && (
                    <>
                      {/* Fill — pointer-events-none so clicks through to timeline */}
                      <div
                        className="absolute top-0 h-full bg-amber-500/20 pointer-events-none"
                        style={{ left: `${(loopStart / duration) * 100}%`, width: `${((loopEnd - loopStart) / duration) * 100}%` }}
                      />
                      {/* Left (start) handle */}
                      <div
                        className="absolute top-0 h-full w-2 -translate-x-1/2 cursor-ew-resize z-10 flex items-center justify-center hover:scale-x-150 transition-transform"
                        style={{ left: `${(loopStart / duration) * 100}%` }}
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); dragModeRef.current = 'start'; }}
                      >
                        <div className="w-0.5 h-5/6 rounded-full bg-amber-400" />
                      </div>
                      {/* Right (end) handle */}
                      <div
                        className="absolute top-0 h-full w-2 -translate-x-1/2 cursor-ew-resize z-10 flex items-center justify-center hover:scale-x-150 transition-transform"
                        style={{ left: `${(loopEnd / duration) * 100}%` }}
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); dragModeRef.current = 'end'; }}
                      >
                        <div className="w-0.5 h-5/6 rounded-full bg-amber-400" />
                      </div>
                    </>
                  )}

                  {/* Playhead */}
                  <div
                    className="absolute top-0 w-px h-full bg-white/50 pointer-events-none"
                    style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Loop mark controls */}
                {loopStart !== null && (
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {loopEnd === null && (
                      <>
                        <span className="text-xs text-amber-400/70 tabular-nums">
                          start {formatTime(loopStart)}
                        </span>
                        <button
                          onClick={markLoopEnd}
                          className="px-3 py-1.5 rounded-lg text-xs border border-amber-500/35 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-all"
                        >
                          Finish loop
                        </button>
                        <button
                          onClick={clearLoop}
                          className="px-2.5 py-1.5 rounded-lg text-xs border border-border text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                  </div>
                )}

                {/* Time row */}
                <div className="flex items-center justify-between text-xs text-text-muted tabular-nums">
                  <span>{formatTime(currentTime)}</span>
                  {!(loopStart !== null && loopEnd !== null) && (
                    <span className="text-text-muted/40 text-[10px]">click to seek · use Start/Finish loop</span>
                  )}
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Transport */}
              <div className={`flex items-center justify-center gap-3 ${focusMode ? 'mb-0 mt-1' : 'mb-2'}`}>
                <button onClick={() => seekBy(-5)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.5 8V4L6 9.5l6.5 5.5v-4c3.5 0 6.5 1.5 8 5-1-4.5-4-8-8-8z" />
                  </svg>
                </button>

                <button onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-amber-500 text-void flex items-center justify-center hover:bg-amber-400 transition-all">
                  {isPlaying ? (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21" />
                    </svg>
                  )}
                </button>

                <button onClick={() => seekBy(5)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all">
                  <svg className="w-5 h-5 scale-x-[-1]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.5 8V4L6 9.5l6.5 5.5v-4c3.5 0 6.5 1.5 8 5-1-4.5-4-8-8-8z" />
                  </svg>
                </button>

                {/* Loop toggle — only visible when a region exists */}
                {loopStart !== null && loopEnd !== null && (
                  <button
                    onClick={() => setIsLooping(l => !l)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      isLooping
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                        : 'bg-surface-raised text-text-muted border border-border hover:text-text-primary'
                    }`}
                  >
                    {isLooping ? '↻ Looping' : '↺ Loop off'}
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        {showSections && (
          <aside className="rounded-xl border border-border bg-surface/80 p-4 xl:sticky xl:top-5 xl:max-h-[calc(100dvh-7rem)] xl:overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-widest text-text-muted">Sections</h3>
              <span className="text-[10px] text-text-muted tabular-nums">{sections.length}</span>
            </div>

            {/* Save loop as section — appears when a loop region is active */}
            {loopStart !== null && loopEnd !== null && (
              <>
                <div className="mb-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <span className="block text-xs text-amber-400/70 tabular-nums">
                    {formatTime(loopStart)} → {formatTime(loopEnd)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsSectionEditorOpen(prev => !prev)}
                      className="flex-1 px-2.5 py-1.5 rounded border border-amber-500/35 text-amber-400 bg-amber-500/10 text-xs hover:bg-amber-500/20 transition-all"
                    >
                      {isSectionEditorOpen ? 'Hide Editor' : activeSectionData ? 'Edit' : 'Add Section'}
                    </button>
                    <button
                      onClick={clearLoop}
                      className="px-2.5 py-1.5 rounded border border-border text-xs text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {isSectionEditorOpen && (
                  <div className="mb-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                    <div className="text-[10px] uppercase tracking-widest text-amber-400/70">
                      {activeSectionData ? 'Editing Section' : 'New Section'}
                    </div>
                    <input
                      type="text"
                      placeholder="Name this section…"
                      value={newSectionName}
                      onChange={e => setNewSectionName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveSection()}
                      className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none border border-border rounded px-2 py-1.5"
                    />
                    <div className="grid grid-cols-1 gap-2">
                      <label className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-text-muted">Start (s)</span>
                        <input
                          type="number"
                          min={0}
                          max={duration > 0 ? duration : undefined}
                          step={0.01}
                          inputMode="decimal"
                          value={loopStart.toFixed(2)}
                          onChange={e => updateLoopStartSeconds(e.target.value)}
                          className="w-full bg-transparent text-sm text-text-primary border border-border rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] uppercase tracking-widest text-text-muted">End (s)</span>
                        <input
                          type="number"
                          min={0}
                          max={duration > 0 ? duration : undefined}
                          step={0.01}
                          inputMode="decimal"
                          value={loopEnd.toFixed(2)}
                          onChange={e => updateLoopEndSeconds(e.target.value)}
                          className="w-full bg-transparent text-sm text-text-primary border border-border rounded px-2 py-1.5 focus:outline-none focus:border-amber-500/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </label>
                    </div>
                    <button
                      onClick={saveSection}
                      className="w-full px-2.5 py-1.5 rounded bg-amber-500/15 text-amber-400 text-xs hover:bg-amber-500/25 transition-all"
                    >
                      {activeSectionData ? 'Update Section' : 'Save Section'}
                    </button>
                  </div>
                )}
              </>
            )}

            {sections.length > 0 ? (
              <div className="space-y-1.5 max-h-[40dvh] xl:max-h-[52dvh] overflow-y-auto pr-1">
                {sections.map(section => (
                  <div
                    key={section.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group ${
                      activeSection === section.id
                        ? 'bg-sky-500/10 border border-sky-500/20'
                        : 'hover:bg-surface-raised border border-transparent'
                    }`}
                    onClick={() => activateSection(section)}
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-text-primary truncate">{section.name}</div>
                      <div className="text-xs text-text-muted tabular-nums">
                        {formatTime(section.startTime)} → {formatTime(section.endTime)}
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          activateSection(section);
                          setIsSectionEditorOpen(true);
                        }}
                        className="px-2 py-1 rounded text-[10px] border border-border text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteSection(section.id); }}
                        className="p-1 text-text-muted hover:text-red-400 transition-all"
                        aria-label={`Delete section ${section.name}`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : loopStart === null && loopEnd === null && (
              <div className="text-sm text-text-muted text-center py-6">
                Use Start loop and Finish loop to mark a region, then save it as a section
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
