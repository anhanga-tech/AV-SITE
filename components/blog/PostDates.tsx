import React from 'react';
import { formatDate } from '../../utils/blog';

interface PostDatesProps {
    date: string;
    dateModified?: string;
}

/**
 * "Publicado em DD/MM/AAAA · Atualizado em DD/MM/AAAA". Cada data vai num
 * `<time dateTime>` com o valor ISO original; `formatDate` só reordena a string
 * (sem passar por `Date`), então a data nunca recua um dia por fuso.
 * "Atualizado em" só aparece quando `dateModified` existe e difere de `date`.
 */
export const PostDates: React.FC<PostDatesProps> = ({ date, dateModified }) => {
    const showModified = Boolean(dateModified) && dateModified !== date;

    return (
        <span>
            Publicado em <time dateTime={date}>{formatDate(date)}</time>
            {showModified && dateModified && (
                <>
                    {' · '}Atualizado em <time dateTime={dateModified}>{formatDate(dateModified)}</time>
                </>
            )}
        </span>
    );
};
