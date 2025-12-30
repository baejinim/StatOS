# 콘텐츠 작성 가이드

이 문서는 정적 블로그에 글을 작성하는 방법을 설명합니다.

## 파일 구조

글은 `src/content/writing/` 디렉토리에 MDX 파일로 작성합니다.

### 카테고리 폴더 구조 (선택사항)

글을 카테고리별로 폴더에 정리할 수 있습니다:

```
src/content/writing/
  mathstat/
    post-1.mdx
    post-2.mdx
  regression/
    post-3.mdx
  projects/
    post-4.mdx
```

폴더 구조는 slug 생성에 영향을 주지 않습니다. slug는 frontmatter의 `slug` 필드 또는 파일명에서 자동 생성됩니다.

## Frontmatter 스키마

모든 글은 다음 frontmatter를 포함해야 합니다:

### 필수 필드

- `title` (string): 글 제목
- `date` (string): 발행일 (YYYY-MM-DD 형식)
- `category` (string): 카테고리 (`mathstat`, `regression`, `projects` 중 하나)

### 선택 필드

- `slug` (string): URL slug (지정하지 않으면 파일명에서 자동 생성)
- `tags` (string[]): 태그 배열
- `summary` (string): 짧은 요약
- `excerpt` (string): RSS/OG용 긴 요약
- `featureImage` (string): 대표 이미지 URL

### 예시

```yaml
---
title: "회귀분석 기초"
date: "2024-01-15"
category: "regression"
tags: ["statistics", "regression"]
summary: "선형 회귀의 기본 개념을 설명합니다"
slug: "regression-basics"
excerpt: "이 글에서는 선형 회귀 분석의 기본 개념과 활용 방법을 다룹니다."
featureImage: "https://example.com/image.jpg"
---
```

## Slug 정책

1. **frontmatter에 `slug`가 있으면**: 해당 값을 사용 (정규화됨)
2. **frontmatter에 `slug`가 없으면**: 파일명에서 자동 생성
   - `.mdx` 확장자 제거
   - 디렉토리 구분자(`/`)를 `-`로 변환
   - 한글/특수문자는 URL-safe하게 정규화

### Slug 충돌

같은 slug를 가진 글이 두 개 이상 있으면 빌드 시 에러가 발생합니다.

## 이미지 경로 규칙

이미지는 `public/images/writing/<slug>/` 디렉토리에 저장하는 것을 권장합니다.

### 예시

글 slug가 `regression-basics`인 경우:

```
public/images/writing/regression-basics/
  diagram.png
  screenshot.jpg
```

MDX에서 참조:

```markdown
![Diagram](/images/writing/regression-basics/diagram.png)
```

## 수식 렌더링

### 인라인 수식

`$...$` 형식으로 작성:

```markdown
이차방정식 $ax^2 + bx + c = 0$의 해는...
```

### 블록 수식

`$$...$$` 형식으로 작성:

```markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### 주의사항

- 코드블럭 내부의 `$`는 수식으로 처리되지 않습니다
- KaTeX를 사용하여 렌더링됩니다

## 템플릿 사용

새 글을 작성할 때는 `src/content/writing/_template.mdx`를 복사하여 시작하세요.

