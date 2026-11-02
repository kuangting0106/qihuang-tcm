export interface LectureEpisode {
  id: string
  number: number
  title: string
  duration: string
  file: string
}

export interface LectureCourse {
  id: string
  title: string
  lecturer: string
  work: string
  collection: string
  description: string
  sourceNote: string
  episodes: LectureEpisode[]
}

export const lectureCourses: LectureCourse[] = [
  {
    id: 'renji-zhenjiudacheng',
    title: '针灸大成',
    lecturer: '倪海厦',
    work: '《针灸大成》',
    collection: '人纪',
    description:
      '倪海厦讲授《针灸大成》的课程录像，按“人纪”课程整理。页面只标注讲授者与课程名，不把讲授者写成原作者。',
    sourceNote:
      '视频由用户提供，版权归原权利人所有；本站仅作学习索引，不提供下载。第 08–11 集未在提供的文件夹中，待补。',
    episodes: [
      { id: '01', number: 1, title: '针灸大成 第 01 集', duration: '49:35', file: '01.mp4' },
      { id: '02', number: 2, title: '针灸大成 第 02 集', duration: '24:18', file: '02.mp4' },
      { id: '03', number: 3, title: '针灸大成 第 03 集', duration: '51:05', file: '03.mp4' },
      { id: '04', number: 4, title: '针灸大成 第 04 集', duration: '26:58', file: '04.mp4' },
      { id: '05', number: 5, title: '针灸大成 第 05 集', duration: '54:18', file: '05.mp4' },
      { id: '06', number: 6, title: '针灸大成 第 06 集', duration: '52:38', file: '06.mp4' },
      { id: '07', number: 7, title: '针灸大成 第 07 集', duration: '1:00:59', file: '07.mp4' },
      { id: '12', number: 12, title: '针灸大成 第 12 集', duration: '48:31', file: '12.mp4' },
    ],
  },
]

const remoteVideoBase = 'http://182.255.94.89:8081'

export function lectureEpisodeSrc(course: LectureCourse, episode: LectureEpisode): string {
  const base = import.meta.env.DEV
    ? `${remoteVideoBase}/videos/lectures/${course.id}/`
    : `${import.meta.env.BASE_URL}videos/lectures/${course.id}/`
  return `${base}${episode.file}`
}
