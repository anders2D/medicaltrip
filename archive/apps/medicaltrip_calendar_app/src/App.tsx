import React, { useState, useEffect } from 'react';
import { useItinerary } from './presentation/hooks/useItinerary';
import { Header } from './presentation/components/layout/Header';
import { Sidebar } from './presentation/components/layout/Sidebar';
import { MasterDetailContainer } from './presentation/components/layout/MasterDetailContainer';
import { CalendarHeader } from './presentation/components/calendar/CalendarHeader';
import { DayView } from './presentation/components/calendar/DayView';
import { WeekView } from './presentation/components/calendar/WeekView';
import { MonthView } from './presentation/components/calendar/MonthView';
import { AgendaView } from './presentation/components/calendar/AgendaView';
import { EventDetailDrawer } from './presentation/components/drawers/EventDetailDrawer';
import { LiveBalanceDrawer } from './presentation/components/drawers/LiveBalanceDrawer';
import { SwarmStatusDrawer } from './presentation/components/drawers/SwarmStatusDrawer';
import { ReceiptOCRModal } from './presentation/components/modals/ReceiptOCRModal';
import { DigitalSignatureModal } from './presentation/components/modals/DigitalSignatureModal';
import { ArchetypeSelectorModal } from './presentation/components/modals/ArchetypeSelectorModal';
import { DailyReportModal } from './presentation/components/modals/DailyReportModal';
import { SettlementSheetModal } from './presentation/components/modals/SettlementSheetModal';
import { InvariantErrorAlert } from './presentation/components/common/InvariantErrorAlert';
import { ItineraryMilestone } from './domain/entities/ItineraryMilestone';
import { Money } from './domain/values/Money';

export const App: React.FC = () => {
  const {
    itinerary,
    patient,
    activeArchetypeId,
    selectedMilestoneId,
    selectedMilestone,
    viewMode,
    currentDate,
    searchQuery,
    categoryFilter,
    statusFilter,
    domainError,
    filteredMilestones,
    setSelectedMilestoneId,
    setViewMode,
    setCurrentDate,
    setSearchQuery,
    setCategoryFilter,
    setStatusFilter,
    setDomainError,
    switchArchetype,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    recordExpense,
    checkInMilestoneGps,
    signOffMilestone,
  } = useItinerary('rva171');

  // Modals & Drawers Visibility State
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isArchetypeModalOpen, setIsArchetypeModalOpen] = useState(false);
  const [isSwarmDrawerOpen, setIsSwarmDrawerOpen] = useState(false);
  const [isDailyReportModalOpen, setIsDailyReportModalOpen] = useState(false);
  const [isSettlementSheetModalOpen, setIsSettlementSheetModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dark Mode synchronization with HTML tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global Keyboard Shortcuts (Nielsen H7: Flexibility & Efficiency of Use)
  // [R] -> Formato Diario ACP, [L] -> Sábana de Liquidación
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsDailyReportModalOpen((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsSettlementSheetModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Date Navigation Handlers
  const handlePrevDate = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const handleNextDate = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenNewEvent = () => {
    setSelectedMilestoneId(null);
    setIsEventDrawerOpen(true);
  };

  const handleSelectMilestone = (m: ItineraryMilestone) => {
    setSelectedMilestoneId(m.id);
    setIsEventDrawerOpen(true);
  };

  const handleSlotClick = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    setCurrentDate(d);
    setSelectedMilestoneId(null);
    setIsEventDrawerOpen(true);
  };

  const handleSaveMilestone = (milestoneId: string | null, formData: any) => {
    if (milestoneId) {
      updateMilestone(milestoneId, formData);
    } else {
      addMilestone(formData);
    }
    setIsEventDrawerOpen(false);
  };

  const handleGpsCheckInSimulation = (m: ItineraryMilestone) => {
    // Check in with valid coordinates (Medellín Poblado)
    checkInMilestoneGps(m.id, { lat: 6.2087, lng: -75.5684 });
  };

  const handleReceiptProcessed = (data: {
    description: string;
    amount: Money;
    receiptUuid: string;
  }) => {
    recordExpense(data.description, data.amount, data.receiptUuid);
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (selectedMilestoneId) {
      const sigUuid = 'sig-' + Date.now().toString(36);
      signOffMilestone(selectedMilestoneId, sigUuid);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top Application Header */}
      <Header
        activeArchetypeId={activeArchetypeId}
        onSelectArchetype={switchArchetype}
        onOpenArchetypeModal={() => setIsArchetypeModalOpen(true)}
        onOpenSwarmDrawer={() => setIsSwarmDrawerOpen(true)}
        onOpenDailyReportModal={() => setIsDailyReportModalOpen(true)}
        onOpenSettlementSheetModal={() => setIsSettlementSheetModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Domain Error Banner */}
      {domainError && (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-2 dark:border-rose-900/60 dark:bg-rose-950/40">
          <InvariantErrorAlert error={domainError} onDismiss={() => setDomainError(null)} />
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          patient={patient}
          itinerary={itinerary}
          categoryFilter={categoryFilter}
          onSelectCategory={setCategoryFilter}
          onNewEvent={handleOpenNewEvent}
          onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
          onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
          onOpenArchetypeModal={() => setIsArchetypeModalOpen(true)}
          onOpenDailyReportModal={() => setIsDailyReportModalOpen(true)}
          onOpenSettlementSheetModal={() => setIsSettlementSheetModalOpen(true)}
        />

        {/* Master-Detail Split Container */}
        <MasterDetailContainer
          masterContent={
            <div className="flex h-full flex-col overflow-hidden">
              {/* Calendar Controls Header */}
              <CalendarHeader
                currentDate={currentDate}
                viewMode={viewMode}
                searchQuery={searchQuery}
                categoryFilter={categoryFilter}
                statusFilter={statusFilter}
                onViewChange={setViewMode}
                onPrevDate={handlePrevDate}
                onNextDate={handleNextDate}
                onToday={handleToday}
                onSearchChange={setSearchQuery}
                onCategoryFilterChange={setCategoryFilter}
                onStatusFilterChange={setStatusFilter}
                onNewEvent={handleOpenNewEvent}
              />

              {/* Multi-View Calendar Engine Switcher */}
              <div className="flex flex-1 overflow-hidden">
                {viewMode === 'day' && (
                  <DayView
                    currentDate={currentDate}
                    milestones={filteredMilestones}
                    onSelectMilestone={handleSelectMilestone}
                    onSlotClick={handleSlotClick}
                    onGpsCheckIn={handleGpsCheckInSimulation}
                  />
                )}
                {viewMode === 'week' && (
                  <WeekView
                    currentDate={currentDate}
                    milestones={filteredMilestones}
                    onSelectMilestone={handleSelectMilestone}
                    onSlotClick={handleSlotClick}
                    onGpsCheckIn={handleGpsCheckInSimulation}
                  />
                )}
                {viewMode === 'month' && (
                  <MonthView
                    currentDate={currentDate}
                    milestones={filteredMilestones}
                    onSelectMilestone={handleSelectMilestone}
                    onDayClick={(d) => {
                      setCurrentDate(d);
                      setViewMode('day');
                    }}
                  />
                )}
                {viewMode === 'agenda' && (
                  <AgendaView
                    milestones={filteredMilestones}
                    onSelectMilestone={handleSelectMilestone}
                    onGpsCheckIn={handleGpsCheckInSimulation}
                    onOpenReceipt={(m) => {
                      setSelectedMilestoneId(m.id);
                      setIsReceiptModalOpen(true);
                    }}
                    onOpenSignature={(m) => {
                      setSelectedMilestoneId(m.id);
                      setIsSignatureModalOpen(true);
                    }}
                  />
                )}
              </div>
            </div>
          }
          detailContent={
            <LiveBalanceDrawer
              itinerary={itinerary}
              onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
              onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
              onOpenSwarmDrawer={() => setIsSwarmDrawerOpen(true)}
            />
          }
        />
      </div>

      {/* Rich Event Detail Slide-Over Drawer */}
      <EventDetailDrawer
        isOpen={isEventDrawerOpen}
        milestone={selectedMilestone}
        onClose={() => setIsEventDrawerOpen(false)}
        onSave={handleSaveMilestone}
        onDelete={(id) => {
          deleteMilestone(id);
          setIsEventDrawerOpen(false);
        }}
        onGpsCheckIn={handleGpsCheckInSimulation}
        onOpenReceiptModal={() => setIsReceiptModalOpen(true)}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
      />

      {/* Receipt OCR Modal */}
      <ReceiptOCRModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        onReceiptProcessed={handleReceiptProcessed}
      />

      {/* Digital Signature Modal */}
      <DigitalSignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        patient={patient}
        milestone={selectedMilestone}
        onSaveSignature={handleSaveSignature}
      />

      {/* 4 Real-World Drive Archetypes Modal */}
      <ArchetypeSelectorModal
        isOpen={isArchetypeModalOpen}
        onClose={() => setIsArchetypeModalOpen(false)}
        activeArchetypeId={activeArchetypeId}
        onSelectArchetype={switchArchetype}
      />

      {/* Web Worker Swarm & SHA-256 Crypto Audit Drawer */}
      <SwarmStatusDrawer
        isOpen={isSwarmDrawerOpen}
        onClose={() => setIsSwarmDrawerOpen(false)}
        itinerary={itinerary}
      />

      {/* Daily Report Entry Modal (Formato Diario ACP) */}
      <DailyReportModal
        isOpen={isDailyReportModalOpen}
        onClose={() => setIsDailyReportModalOpen(false)}
        reservationCode={itinerary.booking.code}
        patientName={patient.fullName}
        defaultGuideName="Andres Cantero"
      />

      {/* Master Settlement Sheet Modal (Formato Liquidación ACP) */}
      <SettlementSheetModal
        isOpen={isSettlementSheetModalOpen}
        onClose={() => setIsSettlementSheetModalOpen(false)}
        reservationCode={itinerary.booking.code}
        patientName={patient.fullName}
        guideName="Andres Cantero"
        initialModality="SPANISH_WITH_CAR"
      />
    </div>
  );
};
