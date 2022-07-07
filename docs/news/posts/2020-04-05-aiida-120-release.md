---
blogpost: true
category: Releases
tags: aiida-core
date: 2020-04-05
---

# AiiDA v1.2.0 released

A new AiiDA release v1.2.0 is available! You can find more information at our [download page](http://www.aiida.net/download/). It can be installed through pip as:

```bash
pip install aiida-core==1.2.0
reentry scan
```

**N.B.:**  the `reentry scan` step is crucial as we have added new entry points.

This is the second minor version of the v1 series and comes with mostly new features.
Especially groups have received a lot of new functionality.

**Groups can now be subclassed**
The `Group` class can now be subclassed to implement custom functionality, just like for example the `Data` node class. They can be registered through entry points in the new entry point category “aiida.groups”. Please refer to the documentation for more details.

**Virtual group hierarchy through `GroupPath`
**The group concept in AiiDA so far has been “flat”. That is to say, group can contain nodes, but you a group cannot contain another group. Many users have expressed the wish to be able to treat groups a bit more like folders on a filesystem and add some hierarchy to them. Thanks to a contribution by Chris Sewell, the `GroupPath` utility now provides a virtual hierarchy based on the group labels. Forward slash characters `/` in group labels will be interpreted as sub groups. A very short demonstration:

```pycon
In [1]: from aiida.tools.groups import GroupPath
   ...: Group(label='project/sub/a')
   ...: Group(label='project/sub/b')
In [2]: path = GroupPath('project/sub')   
   ...: for child in path.children:   
   ...:     group = child.get\_group()   
   ...:     print('Group<{}> contains {} nodes'.format(group.label, group.count()))   
   ...:

Group<project/sub/a> contains 0 nodes
Group<project/sub/b> contains 0 nodes
```

Of course the `GroupPath` class provides much more than that and it is also exposed on the CLI through `verdi group path ls`. Extensive documentation of all functionality will be added to the official documentation soon.

More details and download options can be found through the following links:

- [Change log](https://github.com/aiidateam/aiida-core/blob/v1.2.0/CHANGELOG.md)
- [Clone url](https://github.com/aiidateam/aiida-core/tree/v1.2.0)
- [Download zip](https://github.com/aiidateam/aiida-core/archive/v1.2.0.zip)
