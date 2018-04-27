// @flow
import React, { Component } from "react";
import { StyleSheet, SectionList, View } from "react-native";
import type { SectionBase } from "react-native/Libraries/Lists/SectionList";
import formatDate from "date-fns/format";
import { concat, equals } from "ramda";

import ContentPadding from "./ContentPadding";
import EventCard from "./EventCard";
import Touchable from "./Touchable";
import SectionHeader from "./SectionHeader";
import { selectEventIsFree } from "../selectors/event";
import type {
  SavedEvents,
  Event,
  EventDays,
  LocalizedFieldRef
} from "../data/event";
import { bgColor, eventCardShadow } from "../constants/colors";

type Props = {
  locale: string,
  events: EventDays,
  savedEvents: SavedEvents,
  addSavedEvent: string => void,
  removeSavedEvent: string => void,
  refreshing?: boolean,
  onRefresh?: () => void,
  onPress: (eventName: string) => void,
  getAssetUrl: LocalizedFieldRef => string
};

const separator = style => () => <View style={style} />;

type ItemProps = { item: Event };
const renderItem = (
  isSavedEvent,
  addSavedEvent,
  removeSavedEvent,
  locale,
  onPress,
  getAssetUrl
) => ({ item: event }: ItemProps) => (
  <ContentPadding>
    <Touchable
      style={styles.eventListItem}
      onPress={() => onPress(event.sys.id)}
    >
      <EventCard
        name={event.fields.name[locale]}
        locationName={event.fields.locationName[locale]}
        eventPriceLow={event.fields.eventPriceLow[locale]}
        eventPriceHigh={event.fields.eventPriceHigh[locale]}
        startTime={event.fields.startTime[locale]}
        endTime={event.fields.endTime[locale]}
        imageUrl={getAssetUrl(event.fields.eventsListPicture)}
        isFree={selectEventIsFree(event)}
        isSaved={isSavedEvent(event.sys.id)}
        toggleSaved={active => {
          if (active) {
            addSavedEvent(event.sys.id);
          } else {
            removeSavedEvent(event.sys.id);
          }
        }}
      />
    </Touchable>
  </ContentPadding>
);

type Section = SectionBase<Event> & { title: string };

type SectionProps = { section: Section };
const renderSectionHeader = ({ section }: SectionProps) => (
  <SectionHeader title={section.title} />
);

const eventSections = (events: EventDays, locale: string): Section[] =>
  events.map(it => ({
    data: it,
    title: formatDate(it[0].fields.startTime[locale], "dddd D MMMM")
  }));

const eventIds = (events: EventDays): string[] =>
  events.map(day => day.map(e => e.sys.id)).reduce(concat, []);

class EventList extends Component<Props> {
  static defaultProps = {
    refreshing: false,
    onRefresh: undefined
  };

  shouldComponentUpdate(nextProps: Props) {
    const { locale, refreshing, savedEvents } = this.props;
    const {
      locale: nextLocale,
      refreshing: nextRefreshing,
      savedEvents: nextSavedEvents
    } = nextProps;

    const ids = eventIds(this.props.events);
    const nextIds = eventIds(nextProps.events);

    return (
      !equals(ids, nextIds) ||
      locale !== nextLocale ||
      refreshing !== nextRefreshing ||
      savedEvents !== nextSavedEvents
    );
  }

  render() {
    const {
      events,
      savedEvents,
      addSavedEvent,
      removeSavedEvent,
      locale,
      refreshing,
      onRefresh,
      onPress,
      getAssetUrl
    } = this.props;

    const isSavedEvent = id => savedEvents.has(id);

    return (
      <SectionList
        stickySectionHeadersEnabled
        sections={eventSections(events, locale)}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={separator(styles.sectionFooter)}
        renderItem={renderItem(
          isSavedEvent,
          addSavedEvent,
          removeSavedEvent,
          locale,
          onPress,
          getAssetUrl
        )}
        keyExtractor={event => event.sys.id}
        contentContainerStyle={styles.container}
        ItemSeparatorComponent={separator(styles.itemSeparator)}
        SectionSeparatorComponent={separator(styles.sectionSeparator)}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }
}

const styles = StyleSheet.create({
  itemSeparator: {
    height: 12
  },
  sectionSeparator: {
    height: 6
  },
  container: {
    paddingTop: 0,
    backgroundColor: bgColor
  },
  eventListItem: {
    borderRadius: 5,
    // The below properties are required for ioS shadow
    shadowColor: eventCardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    // The below properties are required for android shadow
    borderWidth: 0,
    elevation: 3,
    backgroundColor: bgColor
  },
  sectionFooter: {
    height: 6
  }
});

export default EventList;
