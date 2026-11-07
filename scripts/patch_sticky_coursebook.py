import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open("src/components/Coursebook/CoursebookView.tsx", "r", encoding="utf-8", newline="") as f:
    content = f.read()

# Normalize content to \n for replacement
crlf = "\r\n" in content
content_norm = content.replace("\r\n", "\n")

old_left = """      {/* Main Layout: Left Lessons List Sidebar + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Lessons Navigation - Sticky when scrolling */}
        <div className="lg:col-span-4 2xl:col-span-3 space-y-4 lg:sticky lg:top-20 self-start">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                Mục lục New HSK {selectedHskLevel}
              </h3>
              <span className="text-[11px] font-bold text-[var(--color-primary)]">
                Bài {currentLesson.lessonNumber} / {activeLessonsList.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">""".replace("\r\n", "\n")

new_left = """      {/* Main Layout: Left Lessons List Sidebar + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Lessons Navigation - Sticky when scrolling */}
        <div className="lg:col-span-4 2xl:col-span-3 space-y-4 lg:sticky lg:top-[68px] sm:lg:top-[72px] z-20 self-start">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[var(--color-primary)]" />
                Mục lục New HSK {selectedHskLevel}
              </h3>
              <span className="text-[11px] font-bold text-[var(--color-primary)]">
                Bài {currentLesson.lessonNumber} / {activeLessonsList.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1 custom-scrollbar">""".replace("\r\n", "\n")

if old_left in content_norm:
    content_norm = content_norm.replace(old_left, new_left)
    print("SUCCESS: Patched Left Column")
else:
    print("FAILED: old_left not found in content_norm")

old_right = """        {/* Right Column: Detailed Lesson Modules */}
        <div className="lg:col-span-8 2xl:col-span-9 space-y-6">
          {/* Lesson Header Card */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-bold">
                    Bài {currentLesson.lessonNumber} • Trang {currentLesson.pageStart}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {currentLesson.titlePinyin}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text-primary)] font-chinese flex items-center gap-3">
                  {currentLesson.titleHanzi}
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentLesson.titleHanzi)}
                    className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-primary)] transition-colors cursor-pointer"
                    title="Nghe phát âm tiêu đề bài học"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </h2>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {currentLesson.titleVietnamese}
                </p>
              </div>

              {/* Objectives Capsule */}
              <div className="bg-[var(--color-bg-secondary)] p-3.5 rounded-xl border border-[var(--color-border)] max-w-sm space-y-1">
                <div className="text-[11px] font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Trọng tâm bài học:
                </div>
                <ul className="text-[11px] text-[var(--color-text-secondary)] space-y-0.5 list-disc list-inside">
                  {currentLesson.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lesson Module Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] pt-2 overflow-x-auto">
              {[
                { key: 'text', label: `Bài Khóa (${currentLesson.texts.length})`, icon: MessageSquare },
                { key: 'grammar', label: `Ngữ Pháp (${currentLesson.grammarPoints.length})`, icon: Lightbulb },
                { key: 'vocab', label: `Từ Vựng (${currentLesson.vocabulary.length})`, icon: FileText },
                { key: 'exercises', label: `Luyện Tập (${currentLesson.exercises.length})`, icon: HelpCircle },
                { key: 'workbook', label: 'Sách Bài Tập (SBT)', icon: BookOpen },
                ...(currentLesson.cultureBonus || currentLesson.tongueTwister
                  ? [{ key: 'culture', label: 'Văn Hóa & Vè', icon: Sparkles }]
                  : []),
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/40'
                        : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>""".replace("\r\n", "\n")

new_right = """        {/* Right Column: Detailed Lesson Modules */}
        <div className="lg:col-span-8 2xl:col-span-9 space-y-5">
          {/* Lesson Header Card */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-bold">
                    Bài {currentLesson.lessonNumber} • Trang {currentLesson.pageStart}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)] font-mono">
                    {currentLesson.titlePinyin}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-[var(--color-text-primary)] font-chinese flex items-center gap-3">
                  {currentLesson.titleHanzi}
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentLesson.titleHanzi)}
                    className="p-1.5 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-primary)] transition-colors cursor-pointer"
                    title="Nghe phát âm tiêu đề bài học"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </h2>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  {currentLesson.titleVietnamese}
                </p>
              </div>

              {/* Objectives Capsule */}
              <div className="bg-[var(--color-bg-secondary)] p-3.5 rounded-xl border border-[var(--color-border)] max-w-sm space-y-1">
                <div className="text-[11px] font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Trọng tâm bài học:
                </div>
                <ul className="text-[11px] text-[var(--color-text-secondary)] space-y-0.5 list-disc list-inside">
                  {currentLesson.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sticky Lesson Module Navigation Tabs Bar */}
          <div className="sticky top-[60px] sm:top-[64px] z-30">
            <div className="bg-[var(--color-surface)]/95 backdrop-blur-md rounded-2xl border border-[var(--color-border)] p-2 shadow-md transition-all">
              <div className="flex items-center justify-between gap-3">
                {/* Module Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
                  {[
                    { key: 'text', label: `Bài Khóa (${currentLesson.texts.length})`, icon: MessageSquare },
                    { key: 'grammar', label: `Ngữ Pháp (${currentLesson.grammarPoints.length})`, icon: Lightbulb },
                    { key: 'vocab', label: `Từ Vựng (${currentLesson.vocabulary.length})`, icon: FileText },
                    { key: 'exercises', label: `Luyện Tập (${currentLesson.exercises.length})`, icon: HelpCircle },
                    { key: 'workbook', label: 'Sách Bài Tập (SBT)', icon: BookOpen },
                    ...(currentLesson.cultureBonus || currentLesson.tongueTwister
                      ? [{ key: 'culture', label: 'Văn Hóa & Vè', icon: Sparkles }]
                      : []),
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.key as any);
                        }}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isActive
                            ? 'bg-[var(--color-primary)] text-white shadow-xs'
                            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Indicator: Current Lesson Title Pill (Visible on Desktop) */}
                <div className="hidden xl:flex items-center gap-2 shrink-0 border-l border-[var(--color-border)] pl-3 pr-2 text-xs">
                  <span className="font-bold text-[var(--color-primary)]">
                    Bài {currentLesson.lessonNumber}:
                  </span>
                  <span className="font-chinese font-bold text-[var(--color-text-primary)] truncate max-w-[170px]" title={currentLesson.titleHanzi}>
                    {currentLesson.titleHanzi}
                  </span>
                </div>
              </div>
            </div>
          </div>""".replace("\r\n", "\n")

if old_right in content_norm:
    content_norm = content_norm.replace(old_right, new_right)
    print("SUCCESS: Patched Right Column Tabs")
else:
    print("FAILED: old_right not found in content_norm")

final_content = content_norm.replace("\n", "\r\n") if crlf else content_norm

with open("src/components/Coursebook/CoursebookView.tsx", "w", encoding="utf-8", newline="") as f:
    f.write(final_content)

print("Saved CoursebookView.tsx successfully")
