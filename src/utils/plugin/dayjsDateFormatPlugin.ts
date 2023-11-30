import * as dayjs from 'dayjs';
import {
  ONE_MINUTE,
  ONE_HOUR,
  DAY_HOURS,
  ONE_WEEK,
  TWO_WEEK,
  ONE_MONTH,
  ONE_YEAR,
} from 'src/config/constants';

declare module 'dayjs' {
  export function convertToKoreanDate(dateToConvert: Date | string): string;
  export function computeTimeDifference(dateToConvert: Date | string): string;
}

export default (option, dayjsClass, dayjsFactory) => {
  dayjsFactory.convertToKoreanDate = function (
    dateToConvert: Date | string
  ): string {
    const daysMap = {
      Sunday: '일',
      Monday: '월',
      Tuesday: '화',
      Wednesday: '수',
      Thursday: '목',
      Friday: '금',
      Saturday: '토',
    };
    const timeOfDayMap = {
      am: '오전',
      pm: '오후',
    };
    const date = dayjs(dateToConvert);
    const convertedDate = date.format('M.D');
    const convertedDay = date.format('dddd');
    const convertedTimeOfDay = date.format('a');
    const convertedTime = date.format('h:mm');

    return `${convertedDate} (${daysMap[convertedDay]}), ${timeOfDayMap[convertedTimeOfDay]} ${convertedTime}`;
  };

  dayjsFactory.computeTimeDifference = function (date: Date | string): string {
    const diffMillisecond = dayjs().diff(date);
    const diffMonth = dayjs().diff(date, 'M');
    const diffYear = dayjs().diff(date, 'y');

    if (diffMillisecond < ONE_MINUTE) {
      return '방금 전';
    } else if (diffMillisecond < ONE_HOUR) {
      return `${dayjs().diff(date, 'm')}분 전`;
    } else if (diffMillisecond < DAY_HOURS) {
      return `${dayjs().diff(date, 'h')}시간 전`;
    } else if (diffMillisecond < ONE_WEEK) {
      return `${dayjs().diff(date, 'd')}일 전`;
    } else if (diffMillisecond < TWO_WEEK) {
      return '지난 주';
    } else if (diffMonth < ONE_MONTH) {
      return `${dayjs().diff(date, 'w')}주 전`;
    } else if (diffYear < ONE_YEAR) {
      return `${diffMonth}달 전`;
    }

    return `${diffYear}년 전`;
  };
};
