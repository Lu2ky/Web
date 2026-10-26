/**
 * Estado y filtros de la vista de horario.
 *
 * Concentra lo que antes vivía disperso en `StudentView`: tema, colores por
 * etiqueta, período académico, semana visible y filtros. La página queda como
 * composición y el calendario solo recibe eventos ya filtrados.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCategories } from '../api/categoriesService';
import { fetchAcademicPeriods } from '../../../shared/api/academicPeriodsService';
import { THEME_OPTIONS } from '../config/themeOptions';
import {
  calculateWeekOffsetForDate,
  getInitialView,
  isActiveLaterallyInWeek,
  isWeekInPeriod,
} from '../lib/scheduleViewUtils';

export function useScheduleView({ classEvents = [], personalEvents = [] } = {}) {
  const [viewMode, setViewMode] = useState(getInitialView);
  const [weekOffset, setWeekOffset] = useState(0);
  const [themeId, setThemeId] = useState('default');
  const [tagColorMap, setTagColorMap] = useState({});
  const [selectedTag, setSelectedTag] = useState('Todos');
  const [selectedAcademicPeriod, setSelectedAcademicPeriod] = useState(null);
  const [academicPeriods, setAcademicPeriods] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((categories) => {
        if (cancelled) return;
        const theme = THEME_OPTIONS.find((option) => option.id === themeId) ?? THEME_OPTIONS[0];
        const palette = theme.colors;
        const map = {};
        categories.forEach((category, index) => {
          map[category] = palette[index % palette.length];
        });
        setTagColorMap(map);
      })
      .catch(() => {
        if (!cancelled) setTagColorMap({});
      });

    return () => {
      cancelled = true;
    };
  }, [themeId]);

  useEffect(() => {
    let cancelled = false;

    fetchAcademicPeriods()
      .then((periods) => {
        if (!cancelled) setAcademicPeriods(periods);
      })
      .catch(() => {
        if (!cancelled) setAcademicPeriods([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const academicPeriodByName = useMemo(
    () =>
      academicPeriods.reduce((accumulator, period) => {
        if (period?.nombre) accumulator[period.nombre] = period;
        return accumulator;
      }, {}),
    [academicPeriods]
  );

  const handleThemeChange = useCallback((newThemeId) => {
    setThemeId(newThemeId);
  }, []);

  const handlePeriodChange = useCallback((periodObj) => {
    setSelectedAcademicPeriod(periodObj);
    setWeekOffset(periodObj?.start_date ? calculateWeekOffsetForDate(periodObj.start_date) : 0);
  }, []);

  const filteredClassesEvents = useMemo(
    () =>
      classEvents.filter((event) => {
        const periodMatch =
          !selectedAcademicPeriod || event.academicPeriod === selectedAcademicPeriod.nombre;
        const tagMatch = selectedTag === 'Todos' || event.etiqueta === selectedTag;
        const classPeriod = academicPeriodByName[event.academicPeriod];
        return periodMatch && tagMatch && isWeekInPeriod(weekOffset, classPeriod);
      }),
    [academicPeriodByName, classEvents, selectedAcademicPeriod, selectedTag, weekOffset]
  );

  const filteredPersonalEvents = useMemo(
    () =>
      personalEvents.filter((event) => {
        const tagMatch = selectedTag === 'Todos' || selectedTag === 'Personal';
        return tagMatch && isActiveLaterallyInWeek(event, weekOffset);
      }),
    [personalEvents, selectedTag, weekOffset]
  );

  return {
    viewMode,
    setViewMode,
    weekOffset,
    setWeekOffset,
    themeId,
    tagColorMap,
    selectedTag,
    setSelectedTag,
    selectedAcademicPeriod,
    filteredClassesEvents,
    filteredPersonalEvents,
    handleThemeChange,
    handlePeriodChange,
  };
}

export default useScheduleView;
