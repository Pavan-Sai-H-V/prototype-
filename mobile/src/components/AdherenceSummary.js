import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar, useTheme } from 'react-native-paper';
import { spacing } from '../utils/theme';

export default function AdherenceSummary({ adherenceData }) {
  const theme = useTheme();

  if (!adherenceData) {
    return null;
  }

  const { adherenceRate, overallStats } = adherenceData;

  const getAdherenceColor = (rate) => {
    if (rate >= 90) return theme.colors.success;
    if (rate >= 70) return theme.colors.warning;
    return theme.colors.error;
  };

  const getAdherenceText = (rate) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 70) return 'Good';
    if (rate >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const styles = StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    adherenceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    adherenceRate: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    adherenceLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginTop: 2,
    },
    progressContainer: {
      marginBottom: spacing.md,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
  });

  const adherenceColor = getAdherenceColor(adherenceRate);
  const takenCount = overallStats.actions?.find(a => a.action === 'taken')?.count || 0;
  const missedCount = overallStats.actions?.find(a => a.action === 'missed')?.count || 0;
  const totalCount = overallStats.total || 0;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Adherence Summary</Text>
      
      <View style={styles.adherenceRow}>
        <View>
          <Text style={[styles.adherenceRate, { color: adherenceColor }]}>
            {adherenceRate}%
          </Text>
          <Text style={[styles.adherenceLabel, { color: adherenceColor }]}>
            {getAdherenceText(adherenceRate)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={adherenceRate / 100}
          color={adherenceColor}
          style={styles.progressBar}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {takenCount}
          </Text>
          <Text style={styles.statLabel}>Taken</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            {missedCount}
          </Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </Card>
  );
}