import { Card, Image, Text, Group, Badge, Stack, ThemeIcon } from '@mantine/core';
import { IconUser, IconMapPin, IconBuildingMonument, IconCalendar, IconGenderFemale, IconGenderMale } from '@tabler/icons-react';
import type { Politician } from '../services/api';
import { calculateAge } from '../utils/personUtils';

interface PoliticianCardProps {
  politician: Politician;
}

export function PoliticianCard({ politician }: PoliticianCardProps) {
  const age = politician.birth_date
    ? calculateAge(politician.birth_date, politician.death_date)
    : null;

  const isDeceased = !!politician.death_date;

  const GenderIcon = politician.gender?.toLowerCase() === 'female'
    ? IconGenderFemale
    : IconGenderMale;

  return (
    <Card className="politician-card" padding="lg">
      <Card.Section>
        {politician.image ? (
          <Image
            src={politician.image}
            height={220}
            alt={politician.name}
            fallbackSrc="https://placehold.co/400x220?text=Sem+Foto"
          />
        ) : (
          <Group className="card-placeholder" justify="center" h={220}>
            <IconUser size={64} />
          </Group>
        )}
      </Card.Section>

      <Stack mt="md" gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text className="politician-name" fw={600} size="lg" truncate>
            {politician.name}
          </Text>
          {politician.party && (
            <Badge className="party-badge">
              {politician.party}
            </Badge>
          )}
        </Group>

        <Group gap="xs" wrap="nowrap">
          <ThemeIcon className="detail-icon" size="sm">
            <IconBuildingMonument size={14} />
          </ThemeIcon>
          <Text className="detail-text" size="sm" truncate>
            {politician.role_title || 'N/A'}
          </Text>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <ThemeIcon className="detail-icon" size="sm">
            <IconMapPin size={14} />
          </ThemeIcon>
          <Text className="detail-text" size="sm">{politician.jurisdiction?.name || 'N/A'}</Text>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <ThemeIcon className="detail-icon" size="sm">
            <GenderIcon size={14} />
          </ThemeIcon>
          <Text className="detail-text" size="sm">{politician.gender || 'N/A'}</Text>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <ThemeIcon className="detail-icon" size="sm">
            <IconCalendar size={14} />
          </ThemeIcon>
          <Text className="detail-text" size="sm">
            {age !== null
              ? (isDeceased ? `Falecido(a) — ${age} anos` : `${age} anos`)
              : 'N/A'}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}

