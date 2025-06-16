{{/*
Expand the name of the chart.
*/}}
{{- define "kuview.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "kuview.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "kuview.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "kuview.labels" -}}
helm.sh/chart: {{ include "kuview.chart" . }}
{{ include "kuview.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "kuview.selectorLabels" -}}
app.kubernetes.io/name: {{ include "kuview.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "kuview.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- if .Values.serviceAccount.name }}
{{- printf "%s-%s" .Release.Name .Values.serviceAccount.name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{ include "kuview.fullname" . }}
{{- end }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the ClusterRole to use
*/}}
{{- define "kuview.clusterRoleName" -}}
{{- printf "%s-%s-clusterrole" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create the name of the ClusterRoleBinding to use
*/}}
{{- define "kuview.clusterRoleBindingName" -}}
{{- printf "%s-%s-clusterrolebinding" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Return the appropriate apiVersion for ingress.
*/}}
{{- define "kuview.ingress.apiVersion" -}}
  {{- if and (.Capabilities.APIVersions.Has "networking.k8s.io/v1") (semverCompare ">=1.19-0" .Capabilities.KubeVersion.GitVersion) -}}
      {{- print "networking.k8s.io/v1" -}}
  {{- else if .Capabilities.APIVersions.Has "networking.k8s.io/v1beta1" -}}
    {{- print "networking.k8s.io/v1beta1" -}}
  {{- else -}}
    {{- print "extensions/v1beta1" -}}
  {{- end -}}
{{- end -}}

{{/*
Return if ingress is stable.
*/}}
{{- define "kuview.ingress.isStable" -}}
  {{- eq (include "kuview.ingress.apiVersion" .) "networking.k8s.io/v1" -}}
{{- end -}}

{{/*
Return if ingress supports pathType.
*/}}
{{- define "kuview.ingress.supportsPathType" -}}
  {{- or (eq (include "kuview.ingress.apiVersion" .) "networking.k8s.io/v1") (eq (include "kuview.ingress.apiVersion" .) "networking.k8s.io/v1beta1") -}}
{{- end -}}
