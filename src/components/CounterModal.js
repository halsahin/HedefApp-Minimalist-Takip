import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet,
    TextInput, Alert, Platform, StatusBar, Vibration, KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Spacing, Radii } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';


const POM_WORK = 25 * 60;
const POM_SHORT = 5 * 60;
const POM_LONG = 15 * 60;

function pad2(n) { return String(Math.floor(n)).padStart(2, '0'); }

function formatSecs(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
    return `${pad2(m)}:${pad2(sec)}`;
}

function fmtDate(iso) {
    const d = new Date(iso);
    return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function fmtClock(iso) {
    const d = new Date(iso);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function nowISO() { return new Date().toISOString(); }

const TYPE_ICON = { pomodoro: '🍅', stopwatch: '⏱️', timer: '⏳' };

export default function CounterModal({
    visible, onClose,
    records, onAddRecord, onAddNote, onEditNote, onDeleteNote, onDeleteRecord,
}) {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();

    // ── navigation ──────────────────────────────────────────────────
    const [view, setView] = useState('counter'); // 'counter' | 'records' | 'detail'
    const [detailId, setDetailId] = useState(null);

    // ── filters ─────────────────────────────────────────────────────
    const [filterType, setFilterType] = useState('all'); // 'all'|'pomodoro'|'stopwatch'|'timer'
    const [filterDate, setFilterDate] = useState('all'); // 'all'|'today'|'week'|'month'|'pick'
    const [filterPickedDate, setFilterPickedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ── tab ─────────────────────────────────────────────────────────
    const [tab, setTab] = useState('pomodoro');

    // ── pomodoro ────────────────────────────────────────────────────
    const [pomPhase, setPomPhase] = useState('work');
    const [pomCount, setPomCount] = useState(0);
    const [pomSecs, setPomSecs] = useState(POM_WORK);
    const [pomRunning, setPomRunning] = useState(false);
    const pomPhaseRef = useRef('work');
    const pomCountRef = useRef(0);
    const pomSecsRef = useRef(POM_WORK);
    const pomStartRef = useRef(null);

    // ── stopwatch ───────────────────────────────────────────────────
    const [swSecs, setSwSecs] = useState(0);
    const [swRunning, setSwRunning] = useState(false);
    const swStartRef = useRef(null);

    // ── timer ───────────────────────────────────────────────────────
    const [timerMins, setTimerMins] = useState(10);
    const [timerSecs, setTimerSecs] = useState(10 * 60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerStarted, setTimerStarted] = useState(false);
    const timerStartRef = useRef(null);
    const timerTargetRef = useRef(10 * 60);
    const timerMinsRef = useRef(10);

    // ── notes ───────────────────────────────────────────────────────
    const [noteText, setNoteText] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);

    // stable ref for onAddRecord to avoid stale closures in intervals
    const onAddRecordRef = useRef(onAddRecord);
    useEffect(() => { onAddRecordRef.current = onAddRecord; }, [onAddRecord]);

    // reset on close
    useEffect(() => {
        if (!visible) fullReset();
    }, [visible]);

    function fullReset() {
        setPomPhase('work'); setPomCount(0); setPomSecs(POM_WORK); setPomRunning(false);
        pomPhaseRef.current = 'work'; pomCountRef.current = 0;
        pomSecsRef.current = POM_WORK; pomStartRef.current = null;

        setSwSecs(0); setSwRunning(false); swStartRef.current = null;

        setTimerMins(10); setTimerSecs(10 * 60); setTimerRunning(false);
        setTimerStarted(false); timerStartRef.current = null;
        timerTargetRef.current = 10 * 60; timerMinsRef.current = 10;

        setNoteText(''); setEditingNoteId(null);
        setView('counter'); setDetailId(null);
    }

    // ── pomodoro interval ───────────────────────────────────────────
    useEffect(() => {
        if (!pomRunning) return;
        const id = setInterval(() => {
            pomSecsRef.current -= 1;
            setPomSecs(pomSecsRef.current);
            if (pomSecsRef.current <= 0) {
                clearInterval(id);
                setPomRunning(false);
                Vibration.vibrate([0, 400, 200, 400]);
                handlePomPhaseEnd();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [pomRunning]);

    function handlePomPhaseEnd() {
        const phase = pomPhaseRef.current;
        if (phase === 'work') {
            onAddRecordRef.current({
                id: Date.now().toString(),
                type: 'pomodoro',
                label: t('counter.pomodoroSession'),
                startTime: pomStartRef.current || nowISO(),
                duration: POM_WORK,
                notes: [],
            });
            pomCountRef.current += 1;
            setPomCount(pomCountRef.current);
            const nextPhase = pomCountRef.current % 4 === 0 ? 'long_break' : 'short_break';
            pomPhaseRef.current = nextPhase;
            setPomPhase(nextPhase);
            const nextSecs = nextPhase === 'long_break' ? POM_LONG : POM_SHORT;
            pomSecsRef.current = nextSecs;
            setPomSecs(nextSecs);
            pomStartRef.current = nowISO();
            // auto-start break
            setTimeout(() => setPomRunning(true), 600);
        } else {
            // break ended → go back to work, wait for user
            pomPhaseRef.current = 'work';
            setPomPhase('work');
            pomSecsRef.current = POM_WORK;
            setPomSecs(POM_WORK);
            pomStartRef.current = nowISO();
        }
    }

    function pomStart() { if (!pomStartRef.current) pomStartRef.current = nowISO(); setPomRunning(true); }
    function pomPause() { setPomRunning(false); }
    function pomReset() {
        setPomRunning(false);
        pomPhaseRef.current = 'work'; setPomPhase('work');
        pomCountRef.current = 0; setPomCount(0);
        pomSecsRef.current = POM_WORK; setPomSecs(POM_WORK);
        pomStartRef.current = null;
    }

    // ── stopwatch interval ──────────────────────────────────────────
    useEffect(() => {
        if (!swRunning) return;
        const id = setInterval(() => setSwSecs(p => p + 1), 1000);
        return () => clearInterval(id);
    }, [swRunning]);

    function swStart() { if (!swStartRef.current) swStartRef.current = nowISO(); setSwRunning(true); }
    function swPause() { setSwRunning(false); }
    function swReset() { setSwRunning(false); setSwSecs(0); swStartRef.current = null; }
    function swSave() {
        if (swSecs === 0) return;
        onAddRecord({
            id: Date.now().toString(),
            type: 'stopwatch',
            label: `${t('counter.stopwatchSession')} (${formatSecs(swSecs)})`,
            startTime: swStartRef.current || nowISO(),
            duration: swSecs,
            notes: [],
        });
        swReset();
    }

    // ── timer interval ──────────────────────────────────────────────
    useEffect(() => {
        if (!timerRunning) return;
        const id = setInterval(() => {
            setTimerSecs(prev => {
                if (prev <= 1) {
                    clearInterval(id);
                    setTimerRunning(false);
                    Vibration.vibrate([0, 400, 200, 400, 200, 400]);
                    onAddRecordRef.current({
                        id: Date.now().toString(),
                        type: 'timer',
                        label: `${timerMinsRef.current}${t('counter.minShort')} ${t('counter.timerSession')}`,
                        startTime: timerStartRef.current || nowISO(),
                        duration: timerTargetRef.current,
                        notes: [],
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [timerRunning]);

    function timerStart() {
        if (!timerStarted) {
            timerTargetRef.current = timerMins * 60;
            timerMinsRef.current = timerMins;
            setTimerSecs(timerMins * 60);
            timerStartRef.current = nowISO();
            setTimerStarted(true);
        }
        setTimerRunning(true);
    }
    function timerPause() { setTimerRunning(false); }
    function timerReset() {
        setTimerRunning(false); setTimerStarted(false);
        timerStartRef.current = null;
        setTimerSecs(timerMins * 60);
        timerTargetRef.current = timerMins * 60;
    }
    function adjustTimerMins(delta) {
        if (timerStarted) return;
        const next = Math.max(1, Math.min(180, timerMins + delta));
        setTimerMins(next);
        setTimerSecs(next * 60);
        timerTargetRef.current = next * 60;
        timerMinsRef.current = next;
    }

    // ── notes ───────────────────────────────────────────────────────
    function handleAddNote() {
        const text = noteText.trim();
        if (!text || !detailId) return;
        if (editingNoteId) {
            onEditNote(detailId, editingNoteId, text);
            setEditingNoteId(null);
        } else {
            onAddNote(detailId, text);
        }
        setNoteText('');
    }

    // ── derived ─────────────────────────────────────────────────────
    const detailRecord = detailId ? records.find(r => r.id === detailId) : null;

    const pomPhaseColor =
        pomPhase === 'work' ? (isDark ? '#FF7A5A' : '#E05A2B') :
            pomPhase === 'short_break' ? (isDark ? '#5DBF72' : '#2B8A4A') :
                (isDark ? '#5AB4FF' : '#1A6FAA');
    const pomPhaseLabel =
        pomPhase === 'work' ? t('counter.work') :
            pomPhase === 'short_break' ? t('counter.shortBreak') :
                t('counter.longBreak');

    // ── render helpers ───────────────────────────────────────────────
    function renderHeader() {
        const titleMap = {
            counter: t('counter.title'),
            records: t('counter.records'),
            detail: detailRecord
                ? `${TYPE_ICON[detailRecord.type]}  ${fmtDate(detailRecord.startTime)}`
                : '',
        };
        return (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                {view !== 'counter' ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (view === 'detail') { setView('records'); setDetailId(null); setNoteText(''); setEditingNoteId(null); }
                            else setView('counter');
                        }}
                        style={styles.headerSide}
                    >
                        <Text style={[styles.backText, { color: colors.accentDark }]}>‹ {t('counter.back')}</Text>
                    </TouchableOpacity>
                ) : <View style={styles.headerSide} />}

                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {titleMap[view]}
                </Text>

                <View style={[styles.headerSide, styles.headerRight]}>
                    {view === 'counter' && (
                        <TouchableOpacity onPress={() => setView('records')}>
                            <Text style={[styles.headerAction, { color: colors.accentDark }]}>{t('counter.records')}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    function renderTabBar() {
        const tabs = [
            { key: 'pomodoro', icon: '🍅', label: 'Pomodoro' },
            { key: 'stopwatch', icon: '⏱️', label: t('counter.stopwatch') },
            { key: 'timer', icon: '⏳', label: t('counter.timer') },
        ];
        return (
            <View style={[styles.tabBar, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                {tabs.map(tb => (
                    <TouchableOpacity
                        key={tb.key}
                        style={[
                            styles.tabBtn,
                            tab === tb.key && { backgroundColor: colors.surface, borderColor: colors.accentDark },
                        ]}
                        onPress={() => setTab(tb.key)}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.tabBtnIcon}>{tb.icon}</Text>
                        <Text style={[styles.tabBtnText, { color: tab === tb.key ? colors.text : colors.textMuted }]}>
                            {tb.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    function renderControls(primary, onPrimary, showReset, onReset, extraBtn) {
        return (
            <View style={styles.controls}>
                <TouchableOpacity
                    style={[styles.ctrlBtnPrimary, { backgroundColor: colors.accentDark }]}
                    onPress={onPrimary}
                    activeOpacity={0.8}
                >
                    <Text style={styles.ctrlBtnPrimaryText}>{primary}</Text>
                </TouchableOpacity>
                {showReset && (
                    <TouchableOpacity
                        style={[styles.ctrlBtn, { borderColor: colors.border }]}
                        onPress={onReset}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.ctrlBtnText, { color: colors.textMuted }]}>{t('counter.reset')}</Text>
                    </TouchableOpacity>
                )}
                {extraBtn}
            </View>
        );
    }

    function renderPomodoro() {
        const primary = pomRunning ? t('counter.pause') :
            (pomStartRef.current ? t('counter.resume') : t('counter.start'));
        const dotsActive = pomCount % 4;
        return (
            <View style={styles.timerSection}>
                <Text style={[styles.phaseLabel, { color: pomPhaseColor }]}>{pomPhaseLabel}</Text>
                <Text style={[styles.bigDisplay, { color: colors.text }]}>{formatSecs(pomSecs)}</Text>
                <View style={styles.pomDots}>
                    {[0, 1, 2, 3].map(i => (
                        <View
                            key={i}
                            style={[
                                styles.pomDot,
                                { borderColor: colors.accentDark },
                                i < dotsActive && { backgroundColor: colors.accentDark },
                            ]}
                        />
                    ))}
                </View>
                <Text style={[styles.pomSubText, { color: colors.textMuted }]}>
                    {pomCount > 0
                        ? `${pomCount} ${t('counter.pomodorosDone')}`
                        : t('counter.pomodoroHint')}
                </Text>
                {renderControls(
                    primary,
                    pomRunning ? pomPause : pomStart,
                    true, pomReset,
                    null,
                )}
            </View>
        );
    }

    function renderStopwatch() {
        const primary = swRunning ? t('counter.pause') :
            (swSecs > 0 ? t('counter.resume') : t('counter.start'));
        return (
            <View style={styles.timerSection}>
                <Text style={[styles.bigDisplay, { color: colors.text }]}>{formatSecs(swSecs)}</Text>
                {renderControls(
                    primary,
                    swRunning ? swPause : swStart,
                    swSecs > 0, swReset,
                    swSecs > 0 && !swRunning ? (
                        <TouchableOpacity
                            style={[styles.ctrlBtn, { borderColor: colors.accentDark, backgroundColor: colors.accentBg }]}
                            onPress={swSave}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.ctrlBtnText, { color: isDark ? colors.accent : '#5A4800' }]}>
                                {t('counter.save')}
                            </Text>
                        </TouchableOpacity>
                    ) : null,
                )}
            </View>
        );
    }

    function renderTimer() {
        const primary = timerRunning ? t('counter.pause') :
            (timerStarted ? t('counter.resume') : t('counter.start'));
        return (
            <View style={styles.timerSection}>
                {!timerStarted ? (
                    <View style={styles.timerSetup}>
                        <Text style={[styles.timerSetupLabel, { color: colors.textMuted }]}>{t('counter.duration')}</Text>
                        <View style={styles.timerSetupRow}>
                            <View style={styles.adjCol}>
                                {[-1, -5].map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        style={[styles.adjBtn, { borderColor: colors.border }]}
                                        onPress={() => adjustTimerMins(d)}
                                    >
                                        <Text style={[styles.adjBtnText, { color: colors.text }]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={[styles.bigDisplay, { color: colors.text }]}>{formatSecs(timerMins * 60)}</Text>
                            <View style={styles.adjCol}>
                                {[1, 5].map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        style={[styles.adjBtn, { borderColor: colors.border }]}
                                        onPress={() => adjustTimerMins(d)}
                                    >
                                        <Text style={[styles.adjBtnText, { color: colors.text }]}>+{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                ) : (
                    <Text style={[
                        styles.bigDisplay,
                        { color: timerSecs <= 10 && timerSecs > 0 ? (isDark ? '#FF7A5A' : '#E05A2B') : colors.text },
                    ]}>
                        {formatSecs(timerSecs)}
                    </Text>
                )}
                {renderControls(
                    primary,
                    timerRunning ? timerPause : timerStart,
                    timerStarted, timerReset,
                    null,
                )}
            </View>
        );
    }

    function renderCounter() {
        return (
            <View style={styles.counterRoot}>
                {renderTabBar()}
                {tab === 'pomodoro' && renderPomodoro()}
                {tab === 'stopwatch' && renderStopwatch()}
                {tab === 'timer' && renderTimer()}
            </View>
        );
    }

    function renderRecords() {
        // Tarih filtreleme
        function isInDateRange(isoStr) {
            if (filterDate === 'all') return true;
            const d = new Date(isoStr);
            const now = new Date();
            if (filterDate === 'today') {
                return d.getDate() === now.getDate() &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();
            }
            if (filterDate === 'week') {
                const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
                return d >= weekAgo;
            }
            if (filterDate === 'month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }
            if (filterDate === 'pick') {
                return d.getDate() === filterPickedDate.getDate() &&
                    d.getMonth() === filterPickedDate.getMonth() &&
                    d.getFullYear() === filterPickedDate.getFullYear();
            }
            return true;
        }

        const filtered = records.filter(r =>
            (filterType === 'all' || r.type === filterType) && isInDateRange(r.startTime)
        );

        const typeFilters = [
            { key: 'all', label: t('counter.filterAll') },
            { key: 'pomodoro', label: '🍅 Pomodoro' },
            { key: 'stopwatch', label: `⏱️ ${t('counter.stopwatch')}` },
            { key: 'timer', label: `⏳ ${t('counter.timer')}` },
        ];
        const dateFilters = [
            { key: 'all', label: t('counter.filterAll') },
            { key: 'today', label: t('counter.filterToday') },
            { key: 'week', label: t('counter.filterWeek') },
            { key: 'month', label: t('counter.filterMonth') },
        ];
        const pickedLabel = `📅 ${pad2(filterPickedDate.getDate())}.${pad2(filterPickedDate.getMonth() + 1)}.${filterPickedDate.getFullYear()}`;


        return (
            <View style={{ flex: 1 }}>
                {/* Tür Filtresi */}
                <View style={styles.filterRow}>
                    <ScrollView
                        horizontal showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterRowContent}
                    >
                        {typeFilters.map(f => (
                            <TouchableOpacity
                                key={f.key}
                                style={[styles.filterChip,
                                { borderColor: colors.border, backgroundColor: colors.surface2 },
                                filterType === f.key && { backgroundColor: colors.accentBg, borderColor: colors.accentDark },
                                ]}
                                onPress={() => setFilterType(f.key)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.filterChipText,
                                { color: filterType === f.key ? (isDark ? colors.accent : '#5A4800') : colors.textMuted },
                                filterType === f.key && { fontWeight: '700' },
                                ]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Tarih Filtresi */}
                <View style={styles.filterRow}>
                    <ScrollView
                        horizontal showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterRowContent}
                    >
                        {dateFilters.map(f => (
                            <TouchableOpacity
                                key={f.key}
                                style={[styles.filterChip,
                                { borderColor: colors.border, backgroundColor: colors.surface2 },
                                filterDate === f.key && { backgroundColor: colors.accentBg, borderColor: colors.accentDark },
                                ]}
                                onPress={() => setFilterDate(f.key)}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.filterChipText,
                                { color: filterDate === f.key ? (isDark ? colors.accent : '#5A4800') : colors.textMuted },
                                filterDate === f.key && { fontWeight: '700' },
                                ]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {/* Gün Seç chip */}
                        <TouchableOpacity
                            style={[styles.filterChip,
                            { borderColor: colors.border, backgroundColor: colors.surface2 },
                            filterDate === 'pick' && { backgroundColor: colors.accentBg, borderColor: colors.accentDark },
                            ]}
                            onPress={() => { setFilterDate('pick'); setShowDatePicker(true); }}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.filterChipText,
                            { color: filterDate === 'pick' ? (isDark ? colors.accent : '#5A4800') : colors.textMuted },
                            filterDate === 'pick' && { fontWeight: '700' },
                            ]}>
                                {filterDate === 'pick' ? pickedLabel : t('counter.filterPick')}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Native Tarih Seçici */}
                {showDatePicker && (
                    <DateTimePicker
                        value={filterPickedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        maximumDate={new Date()}
                        onChange={(event, date) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (date) {
                                setFilterPickedDate(date);
                                setFilterDate('pick');
                            }
                            if (Platform.OS === 'android') setShowDatePicker(false);
                        }}
                    />
                )}

                {/* Kayıt sayısı */}
                <Text style={[styles.filterCount, { color: colors.textMuted }]}>
                    {filtered.length} {t('counter.recordCount')}
                </Text>

                <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
                    {filtered.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyIcon}>🕐</Text>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('counter.noRecords')}</Text>
                        </View>
                    ) : filtered.map(r => (
                        <TouchableOpacity
                            key={r.id}
                            style={[styles.recordRow, { borderBottomColor: colors.border }]}
                            onPress={() => { setDetailId(r.id); setView('detail'); }}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.recordIcon}>{TYPE_ICON[r.type]}</Text>
                            <View style={styles.recordInfo}>
                                <Text style={[styles.recordLabel, { color: colors.text }]}>{r.label}</Text>
                                <Text style={[styles.recordMeta, { color: colors.textMuted }]}>
                                    {fmtDate(r.startTime)}  ·  {fmtClock(r.startTime)}  ·  {formatSecs(r.duration)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => Alert.alert(
                                    r.label, '',
                                    [
                                        { text: t('counter.cancel'), style: 'cancel' },
                                        { text: t('counter.delete'), style: 'destructive', onPress: () => onDeleteRecord(r.id) },
                                    ]
                                )}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={[styles.deleteBtnText, { color: isDark ? '#FF7A5A' : '#E05A2B' }]}>🗑</Text>
                            </TouchableOpacity>
                            <Text style={[styles.recordArrow, { color: colors.textLight }]}>›</Text>
                        </TouchableOpacity>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    }

    function renderDetail() {
        if (!detailRecord) return null;
        const notes = detailRecord.notes || [];
        return (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.listScroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Info card */}
                    <View style={[styles.infoCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                        <Text style={styles.infoCardIcon}>{TYPE_ICON[detailRecord.type]}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoCardLabel, { color: colors.text }]}>{detailRecord.label}</Text>
                            <Text style={[styles.infoCardMeta, { color: colors.textMuted }]}>
                                {fmtDate(detailRecord.startTime)}  ·  {fmtClock(detailRecord.startTime)}
                            </Text>
                            <Text style={[styles.infoCardDuration, { color: colors.accentDark }]}>
                                ⏱  {formatSecs(detailRecord.duration)}
                            </Text>
                        </View>
                    </View>

                    {/* Notes section */}
                    <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{t('counter.notes')}</Text>
                    {notes.length === 0 && (
                        <Text style={[styles.noNotesText, { color: colors.textMuted }]}>{t('counter.noNotes')}</Text>
                    )}
                    {notes.map(note => (
                        <View key={note.id} style={[styles.noteItem, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.noteText, { color: colors.text }]}>{note.text}</Text>
                            <View style={styles.noteFooter}>
                                <Text style={[styles.noteMeta, { color: colors.textMuted }]}>
                                    {fmtDate(note.createdAt)}  {fmtClock(note.createdAt)}
                                </Text>
                                <View style={styles.noteActions}>
                                    <TouchableOpacity onPress={() => { setNoteText(note.text); setEditingNoteId(note.id); }}>
                                        <Text style={[styles.noteAction, { color: colors.accentDark }]}>{t('counter.edit')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => onDeleteNote(detailRecord.id, note.id)}>
                                        <Text style={[styles.noteAction, { color: isDark ? '#FF7A5A' : '#E05A2B' }]}>{t('counter.delete')}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Note input */}
                <View style={[styles.noteInputWrap, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
                    <TextInput
                        style={[styles.noteInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                        placeholder={t('counter.addNote')}
                        placeholderTextColor={colors.textLight}
                        value={noteText}
                        onChangeText={setNoteText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[
                            styles.noteSendBtn,
                            { backgroundColor: noteText.trim() ? colors.accentDark : colors.surface2 },
                        ]}
                        onPress={handleAddNote}
                        disabled={!noteText.trim()}
                    >
                        <Text style={[styles.noteSendBtnText, { color: noteText.trim() ? '#1A1A00' : colors.textMuted }]}>
                            {editingNoteId ? '✓' : '↑'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.root, { backgroundColor: colors.bg }]}>
                {renderHeader()}
                {view === 'counter' && renderCounter()}
                {view === 'records' && renderRecords()}
                {view === 'detail' && renderDetail()}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    // header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + Spacing.md : 44 + Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerSide: { width: 80 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'flex-end' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: Typography.md, fontWeight: '700' },
    headerAction: { fontSize: Typography.xs, fontWeight: '700' },
    backText: { fontSize: Typography.sm, fontWeight: '700' },
    closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
    closeBtnText: { fontSize: Typography.base, fontWeight: '600' },

    // counter view
    counterRoot: { flex: 1, paddingHorizontal: Spacing.xl },

    tabBar: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: Radii.sm,
        padding: 3,
        gap: 3,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    tabBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radii.sm - 2,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 2,
    },
    tabBtnIcon: { fontSize: 18 },
    tabBtnText: { fontSize: 11, fontWeight: '600' },

    timerSection: { flex: 1, alignItems: 'center', paddingTop: Spacing.xl },
    phaseLabel: { fontSize: Typography.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    bigDisplay: { fontSize: 72, fontWeight: '200', letterSpacing: -2, fontVariant: ['tabular-nums'] },

    pomDots: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg, marginBottom: Spacing.xs },
    pomDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
    pomSubText: { fontSize: Typography.xs, marginBottom: Spacing.xl },

    controls: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.xl,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    ctrlBtnPrimary: {
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
        minWidth: 120,
        alignItems: 'center',
    },
    ctrlBtnPrimaryText: { color: '#1A1A00', fontSize: Typography.base, fontWeight: '700' },
    ctrlBtn: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
        minWidth: 90,
        alignItems: 'center',
    },
    ctrlBtnText: { fontSize: Typography.base, fontWeight: '600' },

    // timer setup
    timerSetup: { alignItems: 'center' },
    timerSetupLabel: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md },
    timerSetupRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
    adjCol: { flexDirection: 'column', gap: Spacing.sm },
    adjBtn: { borderWidth: 1, borderRadius: Radii.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, alignItems: 'center', minWidth: 48 },
    adjBtnText: { fontSize: Typography.sm, fontWeight: '600' },

    // filters
    filterRow: {
        paddingHorizontal: Spacing.lg,
        height: 44,
    },
    filterRowContent: { gap: 8, alignItems: 'center', justifyContent: 'flex-start', paddingRight: Spacing.lg },
    filterChip: {
        borderWidth: 1,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterChipText: { fontSize: Typography.sm, lineHeight: 18 },
    filterCount: {
        fontSize: Typography.xs,
        paddingHorizontal: Spacing.xl,
        paddingVertical: 2,
        fontWeight: '500',
    },

    // records list
    listScroll: { flex: 1 },
    emptyWrap: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
    emptyIcon: { fontSize: 48 },
    emptyText: { fontSize: Typography.base },

    recordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md + 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: Spacing.md,
    },
    recordIcon: { fontSize: 24 },
    recordInfo: { flex: 1 },
    recordLabel: { fontSize: Typography.base, fontWeight: '600' },
    recordMeta: { fontSize: Typography.xs, marginTop: 2 },
    recordArrow: { fontSize: 22, fontWeight: '300' },
    deleteBtn: { padding: 4 },
    deleteBtnText: { fontSize: 18 },

    // detail
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        margin: Spacing.xl,
        padding: Spacing.lg,
        borderRadius: Radii.md,
        borderWidth: 1,
    },
    infoCardIcon: { fontSize: 36 },
    infoCardLabel: { fontSize: Typography.base, fontWeight: '700' },
    infoCardMeta: { fontSize: Typography.xs, marginTop: 2 },
    infoCardDuration: { fontSize: Typography.sm, fontWeight: '700', marginTop: 4 },

    sectionLabel: {
        fontSize: Typography.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    noNotesText: { fontSize: Typography.sm, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },

    noteItem: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    noteText: { fontSize: Typography.base, lineHeight: 22 },
    noteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xs },
    noteMeta: { fontSize: Typography.xs },
    noteActions: { flexDirection: 'row', gap: Spacing.lg },
    noteAction: { fontSize: Typography.xs, fontWeight: '700' },

    noteInputWrap: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    noteInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.base,
        maxHeight: 100,
    },
    noteSendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noteSendBtnText: { fontSize: 18, fontWeight: '700' },
});
