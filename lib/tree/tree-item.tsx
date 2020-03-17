import React, {ChangeEventHandler, useRef, useState} from 'react';
import {scopedClassMaker} from '../helpers/classes';
import useUpdate from '../hooks/useUpdate';

interface Props {
  item: SourceDataItem;
  level: number;
  treeProps: TreeProps;
}

const scopedClass = scopedClassMaker('fui-tree');
const sc = scopedClass;

const TreeItem: React.FC<Props> = (props) => {
  const {item, level, treeProps} = props;
  const classes = {
    ['level-' + level]: true,
    'item': true
  };
  const checked = treeProps.multiple ?
    treeProps.selected.indexOf(item.value) >= 0 :
    treeProps.selected === item.value;
  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (treeProps.multiple) {
      if (e.target.checked) {
        treeProps.onChange([...treeProps.selected, item.value]);
      } else {
        treeProps.onChange(treeProps.selected.filter(value => value !== item.value));
      }
    } else {
      if (e.target.checked) {
        treeProps.onChange(item.value);
      } else {
        treeProps.onChange('');
      }
    }
  };
  const expand = () => {
    setExpanded(true);
  };
  const collapse = () => {
    setExpanded(false);
  };
  const [expanded, setExpanded] = useState(true);
  const divRef = useRef<HTMLDivElement>(null);

  useUpdate(expanded, () => {
    if (!divRef.current) {return;}
    if (expanded) {
      divRef.current.style.position = 'absolute';
      divRef.current.style.opacity = '0';
      divRef.current.style.height = 'auto';
      const {height} = divRef.current.getBoundingClientRect();
      divRef.current.style.position = '';
      divRef.current.style.opacity = '';
      divRef.current.style.height = '0px';
      divRef.current.getBoundingClientRect();
      divRef.current.style.height = height + 'px';
      const afterExpand = () => {
        if (!divRef.current) {return;}
        divRef.current.style.height = '';
        divRef.current.classList.add('fui-tree-children-present');
        divRef.current.removeEventListener('transitionend', afterExpand);
      };
      divRef.current.addEventListener('transitionend', afterExpand);
    } else {
      const {height} = divRef.current.getBoundingClientRect();
      divRef.current.style.height = height + 'px';
      divRef.current.getBoundingClientRect();
      divRef.current.style.height = '0px';
      const afterCollapse = () => {
        if (!divRef.current) {return;}
        divRef.current.style.height = '';
        divRef.current.classList.add('fui-tree-children-gone');
        divRef.current.removeEventListener('transitionend', afterCollapse);
      };
      divRef.current.addEventListener('transitionend', afterCollapse);
    }
  });


  return <div key={item.value} className={sc(classes)}>
    <div className={sc('text')}>
      <input type="checkbox" onChange={onChange} checked={checked}/>
      {item.text}
      {item.children &&
      <span onSelect={e => e.preventDefault()}>
          {expanded ?
            <span onClick={collapse}>-</span> :
            <span onClick={expand}>+</span>
          }
        </span>
      }
    </div>
    <div ref={divRef} className={sc({children: true, collapsed: !expanded})}>
      {item.children?.map(sub =>
        <TreeItem key={sub.value} item={sub} level={level + 1} treeProps={treeProps}/>
      )}
    </div>
  </div>;
};


export default TreeItem;
