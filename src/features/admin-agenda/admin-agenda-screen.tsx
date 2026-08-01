import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-users/admin-users.styles";
import type {
  AdminAgendaInput,
  MobileAdminAgendaLesson,
  MobileAdminAgendaStatus,
} from "@/lib/api/admin-agenda-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<ReturnType<typeof getMobileApi>, "getAdminAgenda">;
type Props = {
  client?: Client;
  initialDate?: string;
  initialPeriod?: { month: number; year: number };
  onBack: () => void;
  onOpenLesson?: (lessonId: string) => void;
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const statusLabels: Record<MobileAdminAgendaStatus, string> = {
  ATTENDED: "Veio",
  MAKEUP_ATTENDED: "Reposicao feita",
  MAKEUP_SCHEDULED: "Reposicao",
  MISSED: "Nao veio",
  SCHEDULED: "Previsto",
};
const unitLabels = { DOURADINA: "Douradina", IVATE: "Ivaté" } as const;
const unitFilters: { label: string; value: NonNullable<AdminAgendaInput["unit"]> }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Ivaté", value: "IVATE" },
  { label: "Douradina", value: "DOURADINA" },
];

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function firstDate(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function LessonCard({
  lesson,
  onOpen,
}: {
  lesson: MobileAdminAgendaLesson;
  onOpen?: () => void;
}) {
  const content = (
    <>
      <View style={styles.cardTop}>
        <View style={styles.cardCopy}>
          <Text style={styles.cardName}>{lesson.studentName}</Text>
          <Text style={styles.cardEmail}>{unitLabels[lesson.studentUnit]}</Text>
        </View>
        <View style={[styles.badge, lesson.status === "MISSED" ? styles.badgeInactive : styles.badgeActive]}>
          <Text style={styles.badgeText}>{statusLabels[lesson.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>{lesson.time}</Text>
      {lesson.studentPhone ? <Text style={styles.warning}>{lesson.studentPhone}</Text> : null}
      {lesson.studentNote ? <Text style={styles.warning}>{lesson.studentNote}</Text> : null}
      {lesson.lessonNote ? <Text style={styles.warning}>{lesson.lessonNote}</Text> : null}
    </>
  );
  if (!onOpen) return <View style={styles.card}>{content}</View>;
  return (
    <Pressable
      accessibilityLabel={`Abrir aula de ${lesson.studentName} as ${lesson.time}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      {content}
    </Pressable>
  );
}

export function AdminAgendaScreen({
  client,
  initialDate,
  initialPeriod,
  onBack,
  onOpenLesson,
}: Props) {
  const api = client ?? getMobileApi();
  const now = new Date();
  const [month, setMonth] = useState(initialPeriod?.month ?? now.getMonth() + 1);
  const [year] = useState(initialPeriod?.year ?? now.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    initialDate ?? (initialPeriod ? firstDate(initialPeriod.year, initialPeriod.month) : localDate()),
  );
  const [unit, setUnit] = useState<NonNullable<AdminAgendaInput["unit"]>>("ALL");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const agenda = useQuery({
    queryFn: () =>
      api.getAdminAgenda({
        date: selectedDate,
        month,
        query: appliedQuery || undefined,
        unit,
        year,
      }),
    queryKey: ["admin-agenda", year, month, unit, selectedDate, appliedQuery],
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  });
  const selectedDay = useMemo(
    () => agenda.data?.days.find((day) => day.date === selectedDate),
    [agenda.data?.days, selectedDate],
  );

  function changeMonth(value: number) {
    setMonth(value);
    setSelectedDate(firstDate(year, value));
    setAppliedQuery("");
    setQuery("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>ADMIN · SECRETARIA</Text>
        <Text accessibilityRole="header" style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Calendario interno por unidade e fila organizada do dia.</Text>

        <Text style={styles.filterLabel}>MES · {year}</Text>
        <View style={styles.chips}>
          {months.map((label, index) => {
            const value = index + 1;
            return <Pressable accessibilityLabel={`Filtrar mes ${label}`} accessibilityRole="button" key={label} onPress={() => changeMonth(value)} style={[styles.chip, month === value ? styles.chipSelected : null]}><Text style={[styles.chipText, month === value ? styles.chipTextSelected : null]}>{label}</Text></Pressable>;
          })}
        </View>
        <Text style={styles.filterLabel}>UNIDADE</Text>
        <View style={styles.chips}>
          {unitFilters.map((filter) => <Pressable accessibilityLabel={`Filtrar unidade ${filter.label}`} accessibilityRole="button" key={filter.value} onPress={() => setUnit(filter.value)} style={[styles.chip, unit === filter.value ? styles.chipSelected : null]}><Text style={[styles.chipText, unit === filter.value ? styles.chipTextSelected : null]}>{filter.label}</Text></Pressable>)}
        </View>

        {agenda.isPending ? <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Carregando agenda...</Text></View> : agenda.isError || !agenda.data ? <Pressable onPress={() => void agenda.refetch()} style={styles.stateCard}><Text style={styles.stateTitle}>Agenda indisponivel</Text><Text style={styles.stateText}>Toque para tentar novamente.</Text></Pressable> : (
          <>
            <View style={styles.metrics}>
              <View style={styles.metric}><Text style={styles.metricValue}>{agenda.data.summary.count}</Text><Text style={styles.metricLabel}>aula(s) no mes</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{agenda.data.summary.attendedCount}</Text><Text style={styles.metricLabel}>presenca(s)</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{agenda.data.summary.missedCount}</Text><Text style={styles.metricLabel}>falta(s)</Text></View>
              <View style={styles.metric}><Text style={styles.metricValue}>{agenda.data.summary.makeupCount}</Text><Text style={styles.metricLabel}>reposicao(oes)</Text></View>
            </View>
            <Text style={styles.sectionTitle}>Calendario do mes</Text>
            <View style={styles.chips}>
              {agenda.data.days.map((day) => {
                const number = Number(day.date.slice(-2));
                return <Pressable accessibilityLabel={`Selecionar dia ${number}`} accessibilityRole="button" key={day.date} onPress={() => setSelectedDate(day.date)} style={[styles.chip, selectedDate === day.date ? styles.chipSelected : null]}><Text style={[styles.chipText, selectedDate === day.date ? styles.chipTextSelected : null]}>{number} · {day.count}</Text></Pressable>;
              })}
            </View>
            <Text style={styles.sectionTitle}>Fila de {selectedDate.split("-").reverse().join("/")}</Text>
            <Text style={styles.resultSummary}>{selectedDay?.count ?? 0} aula(s) prevista(s)</Text>
            <View style={styles.searchRow}>
              <TextInput accessibilityLabel="Buscar na agenda do dia" onChangeText={setQuery} onSubmitEditing={() => setAppliedQuery(query.trim())} placeholder="Nome ou telefone" returnKeyType="search" style={styles.searchInput} value={query} />
              <Pressable accessibilityLabel="Pesquisar agenda" accessibilityRole="button" onPress={() => setAppliedQuery(query.trim())} style={styles.searchButton}><Text style={styles.searchButtonText}>Buscar</Text></Pressable>
            </View>
            {agenda.data.dailyLessons.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Nenhuma aula neste dia</Text><Text style={styles.stateText}>Escolha outro dia ou ajuste a busca e a unidade.</Text></View> : null}
            {agenda.data.dailyLessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} onOpen={onOpenLesson ? () => onOpenLesson(lesson.id) : undefined} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
