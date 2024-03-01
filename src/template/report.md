# Automated findings report for {{contest}} | Code4rena audit

## Summary

### Medium
| Id|Issue|Instances|
|-|:-|:-:|
{{#summary_m_issues}}
| [M-{{id}}] | {{details.title}} | {{len}} |
{{/summary_m_issues}}

### Low
| Id|Issue|Instances|
|-|:-|:-:|
{{#summary_low_issues}}
| [L-{{id}}] | {{details.title}} | {{len}} |
{{/summary_low_issues}}

### Non-critical
| Id|Issue|Instances|
|-|:-|:-:|
{{#summary_nc_issues}}
| [NC-{{id}}] | {{details.title}} | {{len}} |
{{/summary_nc_issues}}

### Gas Optimizations


| Id|Issue|Instances|Total Gas Saved|
|-|:-|:-:|:-:|
{{#summary_gas_issues}}
| [G-{{id}}] | {{details.title}} | {{len}} |  -{{savedgas}} |
{{/summary_gas_issues}}



## Details

### Medium
{{#summary_m_issues}}
### [M-{{id}}]: {{details.title}}

{{details.description}}
 
There are {{len}} instances of this issue:

{{#instances}}

```solidity
	{{{extra.auditToPrint}}}
	/* File: {{filename}}
	   Line: {{line}} */
	 {{{codeline}}}
```
[Line {{line}}]({{{baseURL}}}{{{filePath}}}#L{{line}})

{{/instances}}

{{/summary_m_issues}}


---
### Low

{{#summary_low_issues}}
### [L-{{id}}]: {{details.title}}

{{details.description}}
 
There are {{len}} instances of this issue:

{{#instances}}

```solidity
	{{{extra.auditToPrint}}}
	/* File: {{filename}}
	   Line: {{line}} */
	 {{{codeline}}}
```
[Line {{line}}]({{{baseURL}}}{{{filePath}}}#L{{line}})

{{/instances}}

{{/summary_low_issues}}

---
### Non-critical

{{#summary_nc_issues}}
### [NC-{{id}}]: {{details.title}}

{{details.description}}
 
There are {{len}} instances of this issue:

{{#instances}}

```solidity
	{{{extra.auditToPrint}}}
	/* File: {{filename}}
	   Line: {{line}} */
	 {{{codeline}}}
```
[Line {{line}}]({{{baseURL}}}{{{filePath}}}#L{{line}})

{{/instances}}

{{/summary_nc_issues}}

---
### Gas Optimizations

{{#summary_gas_issues}}
### [G-{{id}}]: {{details.title}}

{{details.description}}

There are {{len}} instances of this issue:

{{#instances}}

```solidity
	{{{extra.auditToPrint}}}
	/* File: {{filename}}
	   Line: {{line}} */
	 {{{codeline}}}
```
[Line {{line}}]({{{baseURL}}}{{{filePath}}}#L{{line}})
{{/instances}}

{{/summary_gas_issues}}

