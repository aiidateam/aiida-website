---
blogpost: true
category:
tags:
date: 2019-01-11
---

# AiiDA plugins migration workshop - EPFL, 25-29 March 2019

An **AiiDA plugin migration workshop** will be held at EPFL Lausanne, Switzerland, aiming at collecting about 20 participants.

The workshop will start on Monday 25th March at 2PM and end on Friday 29th March at 1PM.

We are in the process of preparing the AiiDA code towards the 1.0 release, in which we have recently introduced python 2 + python 3 support (already available in the 1.0 alpha releases). While we strive to always maintain back-compatibility, we have realised that there were a few needed improvements to the API and we felt that the 1.0 release was the right moment to introduce them. (Note: while existing "codebases" will need (often very straightforward) migration-which is

what this workshop is for-existing "databases" will be fully compatible and be automatically migrated when users upgrade to AiiDA 1.0).

**The aim of this workshop is to directly support AiiDA plugin developers in the migration of their plugins to support both python 2 and python 3, as well as the changes introduced in AiiDA 1.0.**

This workshop is focused on migrating *existing* plugins (a full list of the plugins supporting almost 60 different codes can be found on the [AiiDA plugin registry](https://aiidateam.github.io/aiida-registry/) page). Another tutorial for new developers of plugins and workflows will be held in Lausanne in the week 20-24 May 2019 and will be advertised soon (stay tuned!).

We will also reserve some time for discussions on plugin interfaces and their homogenisation and common APIs, exploiting this unique occasion bringing together many plugin developers.

**Main topics**

* explanation of the changes on 1.0;

* hands-on workshop on porting plugins to py2+3 and new aiida 1.0;

* discussions on common interfaces to different plugins for common functionalities (e.g. crystal structure relaxation, band structure, ...);

* discussion of automated plugin testing against different versions of AiiDA, python, ...

**Program**

Every day there will be an informal coffee break from 11:00 - 11:15 and 16:00 - 16:15

Monday 25th

2:00 - 2:15: Registration

2:15 - 2:20: Introductory talk

2:20 - 3:20: What's new in v1.0.0 + backwards incompatible changes (Sebastiaan)

3:20 - 4:00: Talk on python2/python3 compatibility

4:00 - 4:30: Coffee break

4:30 - 4:45: Plugin migration - step by step instructions

4:45 - 6:00: Hands-on plugin migration workshop

Tuesday 26th

09:00 - 11:00: Hands-on plugin migration workshop

13:00 - 14:00: Lunch

14:00 - 18:00: Hands-on plugin migration workshop

Wednesday 27th

09:00 - 13:00: Hands-on plugin migration workshop

13:00 - 14:00: Lunch

14:00 - 14:45: Talk on new workflow and engine features

14:45 - 18:00: Hands-on plugin migration workshop

19:00 - 22:00: Social dinner (place to be announced)

Thursday 28th

09:00 - 13:00: Open discussion on plugin common guidelines and common workflow interfaces

13:00 - 14:00: Lunch

14:00 - 18:00: Hands-on plugin migration workshop

Friday 29th

09:00 - 13:00: Hands-on plugin migration workshop

**Support**

This workshop is supported by the [NCCR MARVEL](http://nccr-marvel.ch) funded by the Swiss National Science Foundation and by the [European H2020 MaX Centre of Excellence](http://www.max-centre.eu).
