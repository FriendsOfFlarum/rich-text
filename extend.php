<?php

/*
 * This file is part of fof/rich-text
 *
 * Copyright (c) 2021 Alexander Skvortsov.
 * Copyright (c) 2025 FriendsOfFlarum.
 *
 * For detailed copyright and license information, please view the
 * LICENSE file that was distributed with this source code.
 */

namespace FoF\RichText;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/resources/less/forum.less')
        ->jsDirectory(__DIR__ . '/js/dist/forum'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js')
        ->jsDirectory(__DIR__ . '/js/dist/admin'),

    (new Extend\Frontend('common'))
        ->jsDirectory(__DIR__ . '/js/dist/common'),

    new Extend\Locales(__DIR__ . '/resources/locale'),

    (new Extend\User())
        ->registerPreference('useRichTextEditor', 'boolval', true)
        ->registerPreference('richTextCompactParagraphs', 'boolval', false),

    (new Extend\Settings())
        ->default('fof-rich-text.toggle_on_editor', false)
        ->default('fof-rich-text.force_compact_paragraphs', false)
        ->serializeToForum('toggleRichTextEditorButton', 'fof-rich-text.toggle_on_editor', 'boolval')
        ->serializeToForum('richTextForceCompactParagraphs', 'fof-rich-text.force_compact_paragraphs', 'boolval'),
];
