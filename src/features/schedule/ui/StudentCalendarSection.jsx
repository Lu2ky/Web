/**
 * Sección de calendario del estudiante.
 *
 * Agrupa los fetchers, el calendario, los popups y la barra de control. La
 * página solo compone layout y esta sección; ningún componente conoce las
 * claves `N_*` del backend.
 */

import { useCallback, useState } from 'react';
import ControlBar from './ControlBar/ControlBar';
import Calendar from './Calendar/Calendar';
import { PopUpClasses } from './Calendar/PopUpClasses';
import { PopUpPersonal } from './Calendar/PopUpPersonal';
import OficialFetcher from '../api/OficialFetcher';
import PersonalFetcher, { deletePersonalActivity } from '../api/PersonalFetcher';
import { useScheduleView } from '../model/useScheduleView';
import { toCalendarEvents, toPersonalEvents } from '../lib/scheduleViewUtils';
import MessageConfirmation from '../../../shared/ui/MessageConfirmation';
import { getContrastColor } from '../../../shared/lib/colors';

export function StudentCalendarSection({ numericUserId }) {
  const [classEvents, setClassEvents] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [showPersonalPopup, setShowPersonalPopup] = useState(false);
  const [showDeletePersonalConfirm, setShowDeletePersonalConfirm] = useState(false);
  const [pendingDeletePersonalId, setPendingDeletePersonalId] = useState(null);

  const {
    viewMode,
    setViewMode,
    weekOffset,
    setWeekOffset,
    tagColorMap,
    selectedTag,
    setSelectedTag,
    selectedAcademicPeriod,
    filteredClassesEvents,
    filteredPersonalEvents,
    handleThemeChange,
    handlePeriodChange,
  } = useScheduleView({ classEvents, personalEvents });

  const handleDataLoaded = useCallback((data) => {
    setClassEvents(toCalendarEvents(data));
  }, []);

  const handlePersonalDataLoaded = useCallback((data) => {
    setPersonalEvents(toPersonalEvents(data));
  }, []);

  const handleClassClick = useCallback(
    (event) => {
      const allSessions = classEvents.filter((item) => item.NRC === event.NRC);

      setSelectedClass({
        id: event.course_id ?? event.NRC,
        scheduleId: event.schedule_id ?? null,
        userId: event.user_id ?? numericUserId,
        subject_name: event.subject_name,
        instructor_name: event.professor_name,
        nrc: event.NRC,
        credits: event.credits,
        campus: event.campus,
        code: event.NRC,
        date_range: event.academicPeriod || 'Período actual',
        schedule: allSessions.map((session) => ({
          day: session.day,
          start_time: session.start_time,
          end_time: session.end_time,
          classroom: session.classroom,
          type: session.etiqueta,
        })),
      });
      setShowClassPopup(true);
    },
    [classEvents, numericUserId]
  );

  const handleCloseClassPopup = useCallback(() => {
    setShowClassPopup(false);
    setSelectedClass(null);
  }, []);

  const handlePersonalClick = useCallback((event) => {
    setSelectedPersonal(event);
    setShowPersonalPopup(true);
  }, []);

  const handleClosePersonalPopup = useCallback(() => {
    setShowPersonalPopup(false);
    setSelectedPersonal(null);
  }, []);

  const handleRequestDeletePersonal = useCallback((id) => {
    setPendingDeletePersonalId(id);
    setShowDeletePersonalConfirm(true);
  }, []);

  const handleCloseDeletePersonalConfirm = useCallback(() => {
    setShowDeletePersonalConfirm(false);
    setPendingDeletePersonalId(null);
  }, []);

  const handleConfirmDeletePersonal = useCallback(async () => {
    const id = pendingDeletePersonalId;
    if (!id) {
      handleCloseDeletePersonalConfirm();
      return;
    }

    try {
      await deletePersonalActivity(numericUserId, id);
    } catch (error) {
      console.error('Error al eliminar la actividad personal:', error);
    }

    setPersonalEvents((events) => events.filter((event) => event.id !== id));
    handleClosePersonalPopup();
    handleCloseDeletePersonalConfirm();
  }, [
    handleCloseDeletePersonalConfirm,
    handleClosePersonalPopup,
    numericUserId,
    pendingDeletePersonalId,
  ]);

  const handleActivityAdd = useCallback((newActivity) => {
    setPersonalEvents((events) => [...events, newActivity]);
  }, []);

  const handleActivityUpdate = useCallback(
    (updatedActivity) => {
      setPersonalEvents((events) =>
        events.map((event) =>
          event.id === updatedActivity.id ? { ...event, ...updatedActivity } : event
        )
      );
      setSelectedPersonal((current) =>
        current && current.id === updatedActivity.id ? updatedActivity : current
      );
    },
    []
  );

  return (
    <>
      <OficialFetcher
        userId={numericUserId}
        onDataLoaded={handleDataLoaded}
        academicPeriod={selectedAcademicPeriod}
      />
      <PersonalFetcher
        userId={numericUserId}
        onDataLoaded={handlePersonalDataLoaded}
        academicPeriod={selectedAcademicPeriod}
      />

      <Calendar
        viewMode={viewMode}
        events={filteredClassesEvents}
        personalEvents={filteredPersonalEvents}
        weekOffset={weekOffset}
        setWeekOffset={setWeekOffset}
        onClassClick={handleClassClick}
        onDeletePersonal={handleRequestDeletePersonal}
        onPersonalClick={handlePersonalClick}
        tagColorMap={tagColorMap}
        getContrastColor={getContrastColor}
      />

      <PopUpClasses
        isOpen={showClassPopup}
        onClose={handleCloseClassPopup}
        classData={selectedClass}
        userId={numericUserId}
      />

      <PopUpPersonal
        isOpen={showPersonalPopup}
        onClose={handleClosePersonalPopup}
        personalData={selectedPersonal}
        onUpdate={handleActivityUpdate}
        onDelete={handleRequestDeletePersonal}
        userId={numericUserId}
      />

      <MessageConfirmation
        isOpen={showDeletePersonalConfirm}
        onClose={handleCloseDeletePersonalConfirm}
        onConfirm={handleConfirmDeletePersonal}
        title="¿Eliminar actividad personal?"
        description="Esta acción no se puede deshacer. La actividad se eliminará de tu horario."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />

      <ControlBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        userId={numericUserId}
        idCourse={selectedAcademicPeriod?.id || null}
        onActivityAdd={handleActivityAdd}
        onThemeChange={handleThemeChange}
        onPeriodChange={handlePeriodChange}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
        weekOffset={weekOffset}
        setWeekOffset={setWeekOffset}
      />
    </>
  );
}

export default StudentCalendarSection;
